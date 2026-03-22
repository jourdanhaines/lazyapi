import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { dirname } from "node:path";
import { Modal } from "./Modal";
import { useStore } from "../../state/store";
import { configManager } from "../../services/ConfigManager";
import { storageManager } from "../../services/StorageManager";
import { themeManager } from "../../services/ThemeManager";
import { BUILTIN_THEMES } from "../../types/theme";
import { projectManager } from "../../services/ProjectManager";
import { gitProjectManager } from "../../services/GitProjectManager";
import { VERSION } from "../../version";

const SETTINGS_TABS = ['general', 'theme', 'storage', 'info'] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

const TAB_LABELS: Record<SettingsTab, string> = {
    general: 'General',
    theme: 'Theme',
    storage: 'Storage',
    info: 'Info',
};

interface Props {
    onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
    const theme = useStore(s => s.theme);
    const config = useStore(s => s.config);
    const originalThemeRef = useRef(theme);
    const confirmedThemeRef = useRef(config.ui.theme);

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [themeNames, setThemeNames] = useState<string[]>([]);
    const [themeKeys, setThemeKeys] = useState<string[]>([]);
    const [themeIndex, setThemeIndex] = useState(0);
    const [showAppBackground, setShowAppBackground] = useState(config.ui.showAppBackground);
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [isCheckingVersion, setIsCheckingVersion] = useState(true);
    const [hasVersionError, setHasVersionError] = useState(false);

    const previewTheme = useCallback(async (index: number) => {
        const key = themeKeys[index];
        if (!key) return;
        const t = await themeManager.loadTheme(key);
        useStore.getState().setTheme(t);
    }, [themeKeys]);

    useEffect(() => {
        (async () => {
            const available = await themeManager.listAvailable();
            const names = available.map(key => {
                const builtin = BUILTIN_THEMES[key];
                return builtin ? builtin.name : key;
            });
            setThemeKeys(available);
            setThemeNames(names);
            const currentIdx = available.indexOf(config.ui.theme);
            setThemeIndex(currentIdx >= 0 ? currentIdx : 0);
        })();
    }, []);

    useEffect(() => {
        if (activeTab === 'theme' && themeKeys.length > 0) {
            previewTheme(themeIndex);
        }
    }, [themeIndex, activeTab, themeKeys]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('https://api.github.com/repos/jourdanhaines/lazyapi/releases/latest');
                if (!res.ok) throw new Error('fetch failed');
                const data = await res.json();
                const tag = (data.tag_name as string).replace(/^v/, '');
                setLatestVersion(tag);
            } catch {
                setHasVersionError(true);
            } finally {
                setIsCheckingVersion(false);
            }
        })();
    }, []);

    const isUpdateAvailable = latestVersion !== null && latestVersion !== VERSION;

    useInput((input, key) => {
        if (key.escape) {
            // Revert to last confirmed theme
            const revertKey = confirmedThemeRef.current;
            (async () => {
                const t = await themeManager.loadTheme(revertKey);
                useStore.getState().setTheme(t);
            })();
            onClose();
            return;
        }

        // Tab switching: [, ], left, right
        if (input === '[' || key.leftArrow) {
            setActiveTab(prev => {
                const idx = SETTINGS_TABS.indexOf(prev);
                return SETTINGS_TABS[(idx - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length];
            });
            return;
        }
        if (input === ']' || key.rightArrow) {
            setActiveTab(prev => {
                const idx = SETTINGS_TABS.indexOf(prev);
                return SETTINGS_TABS[(idx + 1) % SETTINGS_TABS.length];
            });
            return;
        }

        if (activeTab === 'general') {
            if (key.return || input === ' ') {
                const newValue = !showAppBackground;
                setShowAppBackground(newValue);
                (async () => {
                    const cfg = await configManager.load();
                    cfg.ui.showAppBackground = newValue;
                    await configManager.save(cfg);
                    useStore.getState().updateConfig({ ui: { ...cfg.ui } });
                })();
            }
        } else if (activeTab === 'info') {
            if (input === 'u' && isUpdateAvailable) {
                useStore.getState().setStatusMessage('Run: curl -fsSL https://raw.githubusercontent.com/jourdanhaines/lazyapi/main/install.sh | bash');
                onClose();
                return;
            }
        } else if (activeTab === 'storage') {
            if (key.return || input === ' ') {
                const store = useStore.getState();
                const project = store.getActiveProject();
                if (!project) return;

                if (project.storageMode === 'local') {
                    (async () => {
                        const gitDir = await gitProjectManager.initGitDir(process.cwd());
                        const updated = { ...project, storageMode: 'git' as const, gitDir };
                        store.updateProject(project.id, { storageMode: 'git', gitDir });
                        await gitProjectManager.saveProject(gitDir, updated);
                        store.setStatusMessage(`Project saved to ${gitDir}`);
                    })();
                } else {
                    (async () => {
                        const updated = { ...project, storageMode: 'local' as const, gitDir: undefined };
                        store.updateProject(project.id, { storageMode: 'local', gitDir: undefined });
                        await projectManager.save(updated);
                        store.setStatusMessage('Project switched to local storage');
                    })();
                }
                onClose();
            }
        } else if (activeTab === 'theme') {
            if (input === 'j' || key.downArrow) {
                setThemeIndex(prev => Math.min(themeNames.length - 1, prev + 1));
            } else if (input === 'k' || key.upArrow) {
                setThemeIndex(prev => Math.max(0, prev - 1));
            } else if (key.return) {
                const selectedKey = themeKeys[themeIndex];
                if (selectedKey) {
                    confirmedThemeRef.current = selectedKey;
                    (async () => {
                        const t = await themeManager.loadTheme(selectedKey);
                        useStore.getState().setTheme(t);
                        const cfg = await configManager.load();
                        cfg.ui.theme = selectedKey;
                        await configManager.save(cfg);
                        useStore.getState().updateConfig({ ui: { ...cfg.ui } });
                    })();
                    onClose();
                }
            }
        }
    });

    return (
        <Modal title="Settings" width={50}>
            <Box>
                {SETTINGS_TABS.map((tab, index) => {
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

                            {index < SETTINGS_TABS.length - 1 && (
                                <Box marginRight={1}>
                                    <Text color={theme.colors.modalHintText}>│</Text>
                                </Box>
                            )}
                        </React.Fragment>
                    );
                })}
            </Box>

            <Box flexDirection="column" marginTop={1}>
                {activeTab === 'general' && (
                    <Box flexDirection="column">
                        <Box>
                            <Text color={theme.colors.selectedItem}>
                                {'▸ '}Show App Background: {' '}
                            </Text>
                            <Text color={showAppBackground ? 'green' : 'gray'} bold>
                                {showAppBackground ? 'ON' : 'OFF'}
                            </Text>
                        </Box>
                    </Box>
                )}
                {activeTab === 'storage' && (() => {
                    const project = useStore.getState().getActiveProject();
                    const isGit = project?.storageMode === 'git';
                    return (
                        <Box flexDirection="column">
                            {!project && (
                                <Text color="gray" italic>No active project.</Text>
                            )}

                            {project && (
                                <Box flexDirection="column">
                                    <Box>
                                        <Text color={theme.colors.modalText}>Project:  </Text>
                                        <Text color={theme.colors.modalTitleText} bold>{project.name}</Text>
                                    </Box>

                                    <Box marginTop={1}>
                                        <Text color={theme.colors.selectedItem}>
                                            {'▸ '}Storage Mode: {' '}
                                        </Text>
                                        <Text color={isGit ? 'green' : 'gray'} bold>
                                            {isGit ? 'Git' : 'Local'}
                                        </Text>
                                    </Box>

                                    {isGit && project.gitDir && (
                                        <Box marginTop={1}>
                                            <Text color={theme.colors.modalText}>Path: </Text>
                                            <Text color="gray">{project.gitDir}</Text>
                                        </Box>
                                    )}

                                    <Box marginTop={1}>
                                        <Text color="gray" italic>
                                            {isGit
                                                ? 'Press Enter to switch back to local storage.'
                                                : 'Press Enter to store in .lazyapi/ for Git sharing.'}
                                        </Text>
                                    </Box>

                                    {isGit && (
                                        <Box marginTop={1}>
                                            <Text color="yellow">
                                                Secrets (isSecret=true) are stored in secrets.json (gitignored).
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    );
                })()}

                {activeTab === 'theme' && (
                    <Box flexDirection="column">
                        {themeNames.map((name, index) => (
                            <Box
                                key={name}
                                backgroundColor={index === themeIndex ? theme.colors.selectedItemBg : undefined}
                            >
                                <Text color={index === themeIndex ? theme.colors.selectedItem : theme.colors.modalText}>
                                    {` ${name} `}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                )}
                {activeTab === 'info' && (
                    <Box flexDirection="column" gap={1}>
                        <Box>
                            <Text color={theme.colors.modalText}>Version:     </Text>
                            <Text color={theme.colors.modalText}>{VERSION} </Text>
                            {isCheckingVersion && <Text color="gray">(checking...)</Text>}
                            {hasVersionError && <Text color="gray">(unable to check)</Text>}
                            {!isCheckingVersion && !hasVersionError && !isUpdateAvailable && (
                                <Text color="green">(latest)</Text>
                            )}
                            {isUpdateAvailable && (
                                <Text color="yellow">(v{latestVersion} available)</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={theme.colors.modalText}>Author:      </Text>
                            <Text color={theme.colors.modalText}>Jourdan Haines</Text>
                        </Box>

                        <Box>
                            <Text color={theme.colors.modalText}>Install Dir: </Text>
                            <Text color={theme.colors.modalText}>{dirname(process.execPath)}</Text>
                        </Box>

                        <Box>
                            <Text color={theme.colors.modalText}>Config Dir:  </Text>
                            <Text color={theme.colors.modalText}>{storageManager.getBaseDir()}</Text>
                        </Box>
                    </Box>
                )}
            </Box>

            <Box marginTop={1}>
                <Text color={theme.colors.modalHintText}>
                    {activeTab === 'general' && '[/]: tabs  Enter/Space: toggle  Esc: close'}
                    {activeTab === 'storage' && '[/]: tabs  Enter/Space: toggle mode  Esc: close'}
                    {activeTab === 'theme' && '[/]: tabs  j/k: navigate  Enter: select  Esc: cancel'}
                    {activeTab === 'info' && isUpdateAvailable && '[/]: tabs  u: update  Esc: close'}
                    {activeTab === 'info' && !isUpdateAvailable && '[/]: tabs  Esc: close'}
                </Text>
            </Box>
        </Modal>
    );
}
