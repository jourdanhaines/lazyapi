import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { Modal } from "./Modal";
import { TextInputField } from "../shared/TextInputField";
import { useStore } from "../../state/store";
import { projectManager } from "../../services/ProjectManager";
import { environmentId } from "../../utils/id";
import type { Environment } from "../../types/environment";
import type { KeyValuePair } from "../../types/request";

const ENV_TABS = ['list', 'variables', 'headers'] as const;
type EnvTab = (typeof ENV_TABS)[number];

const TAB_LABELS: Record<EnvTab, string> = {
    list: 'Environments',
    variables: 'Variables',
    headers: 'Headers',
};

type InputTarget =
    | { type: 'envName'; envId?: string }
    | { type: 'varKey'; index: number }
    | { type: 'varValue'; index: number }
    | { type: 'headerKey'; index: number }
    | { type: 'headerValue'; index: number };

interface Props {
    onClose: () => void;
}

export function EnvironmentModal({ onClose }: Props) {
    const theme = useStore(s => s.theme);

    const [activeTab, setActiveTab] = useState<EnvTab>('list');
    const [envIndex, setEnvIndex] = useState(0);
    const [varIndex, setVarIndex] = useState(0);
    const [headerIndex, setHeaderIndex] = useState(0);
    const [inputTarget, setInputTarget] = useState<InputTarget | null>(null);
    const [inputDefault, setInputDefault] = useState('');

    const getProject = useCallback(() => useStore.getState().getActiveProject(), []);
    const getEnvironments = useCallback(() => getProject()?.environments ?? [], []);

    const getSelectedEnv = useCallback((): Environment | null => {
        const envs = getEnvironments();
        return envs[envIndex] ?? null;
    }, [envIndex]);

    function saveProject() {
        const project = getProject();
        if (project) projectManager.saveDebounced(project);
    }

    function updateEnvironment(envId: string, updates: Partial<Environment>) {
        const project = getProject();
        if (!project) return;
        const newEnvs = project.environments.map(e =>
            e.id === envId ? { ...e, ...updates } : e
        );
        useStore.getState().updateProject(project.id, { environments: newEnvs });
    }

    function handleInputSubmit(value: string) {
        if (!inputTarget) return;
        const project = getProject();
        if (!project) return;

        const store = useStore.getState();

        switch (inputTarget.type) {
            case 'envName': {
                if (!value.trim()) break;
                if (inputTarget.envId) {
                    updateEnvironment(inputTarget.envId, { name: value.trim() });
                } else {
                    const newEnv: Environment = {
                        id: environmentId(),
                        name: value.trim(),
                        variables: [],
                    };
                    const newEnvs = [...project.environments, newEnv];
                    store.updateProject(project.id, { environments: newEnvs });
                    setEnvIndex(newEnvs.length - 1);
                }
                break;
            }
            case 'varKey': {
                const env = getSelectedEnv();
                if (!env) break;
                if (inputTarget.index >= env.variables.length) {
                    const newVars = [...env.variables, { key: value, value: '', enabled: true }];
                    updateEnvironment(env.id, { variables: newVars });
                    setVarIndex(newVars.length - 1);
                    setInputTarget({ type: 'varValue', index: newVars.length - 1 });
                    setInputDefault('');
                    return;
                }
                const newVars = env.variables.map((v, i) =>
                    i === inputTarget.index ? { ...v, key: value } : v
                );
                updateEnvironment(env.id, { variables: newVars });
                break;
            }
            case 'varValue': {
                const env = getSelectedEnv();
                if (!env) break;
                const newVars = env.variables.map((v, i) =>
                    i === inputTarget.index ? { ...v, value } : v
                );
                updateEnvironment(env.id, { variables: newVars });
                break;
            }
            case 'headerKey': {
                const env = getSelectedEnv();
                if (!env) break;
                const headers = env.defaultHeaders ?? [];
                if (inputTarget.index >= headers.length) {
                    const newHeaders = [...headers, { key: value, value: '', enabled: true }];
                    updateEnvironment(env.id, { defaultHeaders: newHeaders });
                    setHeaderIndex(newHeaders.length - 1);
                    setInputTarget({ type: 'headerValue', index: newHeaders.length - 1 });
                    setInputDefault('');
                    return;
                }
                const newHeaders = headers.map((h, i) =>
                    i === inputTarget.index ? { ...h, key: value } : h
                );
                updateEnvironment(env.id, { defaultHeaders: newHeaders });
                break;
            }
            case 'headerValue': {
                const env = getSelectedEnv();
                if (!env) break;
                const headers = env.defaultHeaders ?? [];
                const newHeaders = headers.map((h, i) =>
                    i === inputTarget.index ? { ...h, value } : h
                );
                updateEnvironment(env.id, { defaultHeaders: newHeaders });
                break;
            }
        }

        saveProject();
        setInputTarget(null);
    }

    useInput((input, key) => {
        if (inputTarget) {
            if (key.escape) {
                setInputTarget(null);
            }
            return;
        }

        if (key.escape) {
            saveProject();
            onClose();
            return;
        }

        if (input === '[' || key.leftArrow) {
            setActiveTab(prev => {
                const idx = ENV_TABS.indexOf(prev);
                return ENV_TABS[(idx - 1 + ENV_TABS.length) % ENV_TABS.length];
            });
            return;
        }
        if (input === ']' || key.rightArrow) {
            setActiveTab(prev => {
                const idx = ENV_TABS.indexOf(prev);
                return ENV_TABS[(idx + 1) % ENV_TABS.length];
            });
            return;
        }

        if (activeTab === 'list') {
            handleListKeys(input, key);
        } else if (activeTab === 'variables') {
            handleVariableKeys(input, key);
        } else if (activeTab === 'headers') {
            handleHeaderKeys(input, key);
        }
    });

    function handleListKeys(input: string, key: any) {
        const envs = getEnvironments();
        const project = getProject();
        if (!project) return;

        if (input === 'j' || key.downArrow) {
            setEnvIndex(prev => Math.min(envs.length - 1, prev + 1));
        } else if (input === 'k' || key.upArrow) {
            setEnvIndex(prev => Math.max(0, prev - 1));
        } else if (input === 'a') {
            setInputTarget({ type: 'envName' });
            setInputDefault('');
        } else if (input === 'e' && envs[envIndex]) {
            setInputTarget({ type: 'envName', envId: envs[envIndex].id });
            setInputDefault(envs[envIndex].name);
        } else if (input === 'd' && envs[envIndex]) {
            const envId = envs[envIndex].id;
            const newEnvs = envs.filter(e => e.id !== envId);
            const updates: Partial<typeof project> = { environments: newEnvs };
            if (project.activeEnvironmentId === envId) {
                updates.activeEnvironmentId = null;
            }
            useStore.getState().updateProject(project.id, updates);
            setEnvIndex(prev => Math.max(0, Math.min(prev, newEnvs.length - 1)));
            saveProject();
        } else if (key.return && envs[envIndex]) {
            const envId = envs[envIndex].id;
            const newActiveId = project.activeEnvironmentId === envId ? null : envId;
            useStore.getState().setActiveEnvironment(project.id, newActiveId);
            saveProject();
        } else if (input === 'n') {
            useStore.getState().setActiveEnvironment(project.id, null);
            saveProject();
        }
    }

    function handleVariableKeys(input: string, key: any) {
        const env = getSelectedEnv();
        if (!env) return;
        const vars = env.variables;

        if (input === 'j' || key.downArrow) {
            setVarIndex(prev => Math.min(vars.length - 1, prev + 1));
        } else if (input === 'k' || key.upArrow) {
            setVarIndex(prev => Math.max(0, prev - 1));
        } else if (input === 'a') {
            setInputTarget({ type: 'varKey', index: vars.length });
            setInputDefault('');
        } else if (input === 'e' && vars[varIndex]) {
            setInputTarget({ type: 'varKey', index: varIndex });
            setInputDefault(vars[varIndex].key);
        } else if (input === 'v' && vars[varIndex]) {
            setInputTarget({ type: 'varValue', index: varIndex });
            setInputDefault(vars[varIndex].value);
        } else if (input === ' ' && vars[varIndex]) {
            const newVars = vars.map((v, i) =>
                i === varIndex ? { ...v, enabled: !v.enabled } : v
            );
            updateEnvironment(env.id, { variables: newVars });
            saveProject();
        } else if (input === 'd' && vars[varIndex]) {
            const newVars = vars.filter((_, i) => i !== varIndex);
            updateEnvironment(env.id, { variables: newVars });
            setVarIndex(prev => Math.max(0, Math.min(prev, newVars.length - 1)));
            saveProject();
        }
    }

    function handleHeaderKeys(input: string, key: any) {
        const env = getSelectedEnv();
        if (!env) return;
        const headers = env.defaultHeaders ?? [];

        if (input === 'j' || key.downArrow) {
            setHeaderIndex(prev => Math.min(headers.length - 1, prev + 1));
        } else if (input === 'k' || key.upArrow) {
            setHeaderIndex(prev => Math.max(0, prev - 1));
        } else if (input === 'e' && headers[headerIndex]) {
            setInputTarget({ type: 'headerKey', index: headerIndex });
            setInputDefault(headers[headerIndex].key);
        } else if (input === 'v' && headers[headerIndex]) {
            setInputTarget({ type: 'headerValue', index: headerIndex });
            setInputDefault(headers[headerIndex].value);
        } else if (input === 'a') {
            setInputTarget({ type: 'headerKey', index: headers.length });
            setInputDefault('');
        } else if (input === ' ' && headers[headerIndex]) {
            const newHeaders = headers.map((h, i) =>
                i === headerIndex ? { ...h, enabled: !h.enabled } : h
            );
            updateEnvironment(env.id, { defaultHeaders: newHeaders });
            saveProject();
        } else if (input === 'd' && headers[headerIndex]) {
            const newHeaders = headers.filter((_, i) => i !== headerIndex);
            updateEnvironment(env.id, { defaultHeaders: newHeaders });
            setHeaderIndex(prev => Math.max(0, Math.min(prev, newHeaders.length - 1)));
            saveProject();
        }
    }

    const project = getProject();
    const envs = getEnvironments();
    const selectedEnv = getSelectedEnv();

    function renderKvPair(pair: KeyValuePair, index: number, isSelected: boolean) {
        return (
            <Box
                key={index}
                backgroundColor={isSelected ? theme.colors.selectedItemBg : undefined}
            >
                <Text color={pair.enabled ? undefined : 'gray'} strikethrough={!pair.enabled}>
                    {'  '}{pair.key || '<key>'}
                </Text>

                <Text color="gray"> = </Text>

                <Text color={pair.enabled ? undefined : 'gray'} strikethrough={!pair.enabled}>
                    {pair.value || '<value>'}
                </Text>

                {!pair.enabled && <Text color="gray"> (disabled)</Text>}
            </Box>
        );
    }

    return (
        <Modal title="Environments" width={60}>
            <Box>
                {ENV_TABS.map((tab, index) => {
                    const isActive = tab === activeTab;
                    return (
                        <React.Fragment key={tab}>
                            <Box marginRight={1}>
                                <Text
                                    color={isActive ? theme.colors.modalTitleText : theme.colors.modalHintText}
                                    bold={isActive}
                                    underline={isActive}
                                >
                                    {TAB_LABELS[tab]}
                                </Text>
                            </Box>

                            {index < ENV_TABS.length - 1 && (
                                <Box marginRight={1}>
                                    <Text color={theme.colors.modalHintText}>|</Text>
                                </Box>
                            )}
                        </React.Fragment>
                    );
                })}
            </Box>

            <Box flexDirection="column" marginTop={1}>
                {activeTab === 'list' && (
                    <Box flexDirection="column">
                        {envs.length === 0 && (
                            <Text color="gray" italic>No environments. Press 'a' to add.</Text>
                        )}

                        {envs.map((env, index) => {
                            const isSelected = index === envIndex;
                            const isActive = project?.activeEnvironmentId === env.id;
                            return (
                                <Box
                                    key={env.id}
                                    backgroundColor={isSelected ? theme.colors.selectedItemBg : undefined}
                                >
                                    <Text color={isSelected ? theme.colors.selectedItem : theme.colors.modalText}>
                                        {isActive ? ' * ' : '   '}{env.name}
                                    </Text>

                                    <Text color="gray">
                                        {' '}({env.variables.length} vars)
                                    </Text>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {activeTab === 'variables' && (
                    <Box flexDirection="column">
                        {!selectedEnv && (
                            <Text color="gray" italic>Select an environment in the list tab first.</Text>
                        )}

                        {selectedEnv && (
                            <Box flexDirection="column">
                                <Box marginBottom={1}>
                                    <Text color={theme.colors.modalTitleText} bold>{selectedEnv.name}</Text>
                                    <Text color={theme.colors.modalHintText}> variables</Text>
                                </Box>

                                {selectedEnv.variables.length === 0 && (
                                    <Text color="gray" italic>No variables. Press 'a' to add.</Text>
                                )}

                                {selectedEnv.variables.map((v, index) =>
                                    renderKvPair(v, index, index === varIndex)
                                )}
                            </Box>
                        )}
                    </Box>
                )}

                {activeTab === 'headers' && (
                    <Box flexDirection="column">
                        {!selectedEnv && (
                            <Text color="gray" italic>Select an environment in the list tab first.</Text>
                        )}

                        {selectedEnv && (
                            <Box flexDirection="column">
                                <Box marginBottom={1}>
                                    <Text color={theme.colors.modalTitleText} bold>{selectedEnv.name}</Text>
                                    <Text color={theme.colors.modalHintText}> default headers</Text>
                                </Box>

                                {(selectedEnv.defaultHeaders ?? []).length === 0 && (
                                    <Text color="gray" italic>No default headers. Press 'a' to add.</Text>
                                )}

                                {(selectedEnv.defaultHeaders ?? []).map((h, index) =>
                                    renderKvPair(h, index, index === headerIndex)
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {inputTarget && (
                <Box marginTop={1}>
                    <Text color={theme.colors.modalTitleText}>{'> '}</Text>
                    <TextInputField
                        defaultValue={inputDefault}
                        onChange={() => {}}
                        onSubmit={handleInputSubmit}
                    />
                </Box>
            )}

            <Box marginTop={1}>
                <Text color={theme.colors.modalHintText}>
                    {activeTab === 'list' && '[/]: tabs  j/k: navigate  a: add  e: edit  d: delete  Enter: activate  n: none  Esc: close'}
                    {activeTab === 'variables' && '[/]: tabs  j/k: navigate  a: add  e: edit key  v: edit value  d: delete  space: toggle  Esc: close'}
                    {activeTab === 'headers' && '[/]: tabs  j/k: navigate  e: edit key  v: edit value  a: add  d: delete  space: toggle  Esc: close'}
                </Text>
            </Box>
        </Modal>
    );
}
