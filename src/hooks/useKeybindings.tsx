import React from "react";
import { Text, useInput } from "ink";
import { useStore } from "../state/store";
import type { PanelId } from "../types/ui";
import { projectManager } from "../services/ProjectManager";
import { requestExecutor } from "../services/RequestExecutor";
import { historyManager } from "../services/HistoryManager";
import { configManager } from "../services/ConfigManager";
import { requestId, folderId } from "../utils/id";
import { flattenVisibleTree } from "../utils/tree";
import { insertNode, removeNode, toggleFolder, updateNode, moveNode } from "../utils/tree";
import type { RequestItem, RequestFolder, HttpMethod, KeyValuePair, RequestBodyType } from "../types/request";
import { HTTP_METHODS } from "../types/request";
import { copyToClipboard } from "../utils/clipboard";
import { formatDuration } from "../utils/format";
import { getMethodColor } from "../utils/color";
export function useKeybindings(onQuit: () => void) {
    const store = useStore();

    useInput((input, key) => {
        const { modal, inputMode, focusedPanel } = store;

        // When modal is open or in input mode, skip all bindings
        if (modal || inputMode) return;

        // Global keybindings
        if (key.tab && !key.shift) {
            store.nextPanel();
            return;
        }
        if (key.tab && key.shift) {
            store.prevPanel();
            return;
        }

        // Left/right arrows navigate between panels
        if (key.leftArrow) {
            store.prevPanel();
            return;
        }
        if (key.rightArrow) {
            store.nextPanel();
            return;
        }

        if (input === '1') { store.setFocusedPanel('projects'); return; }
        if (input === '2') { store.setFocusedPanel('requests'); return; }
        if (input === '3') { store.setFocusedPanel('editor'); return; }
        if (input === '4') { store.setFocusedPanel('response'); return; }
        if (input === '?') {
            store.openModal({
                type: 'help',
                title: 'Help',
                onConfirm: () => {},
                onCancel: () => {},
            });
            return;
        }
        if (input === 'q') {
            onQuit();
            return;
        }

        // Panel-specific keybindings
        switch (focusedPanel) {
            case 'projects':
                handleProjectKeys(input, key, store);
                break;
            case 'requests':
                handleRequestTreeKeys(input, key, store);
                break;
            case 'editor':
                handleEditorKeys(input, key, store);
                break;
            case 'response':
                handleResponseKeys(input, key, store);
                break;
        }
    });
}

function handleProjectKeys(input: string, key: any, store: ReturnType<typeof useStore.getState>) {
    if (input === 'a') {
        store.openModal({
            type: 'input',
            title: 'New Project',
            message: 'Enter project name:',
            onConfirm: async (name) => {
                if (!name.trim()) return;
                const project = await projectManager.create(name.trim());
                store.addProject(project);
                store.setActiveProject(project.id);
                const config = await configManager.load();
                config.lastProjectId = project.id;
                config.projectOrder = useStore.getState().projects.map(p => p.id);
                const cwd = process.cwd();
                config.directoryMap[cwd] = project.id;
                await configManager.save(config);
            },
            onCancel: () => {},
        });
        return;
    }

    if (input === 'd') {
        const projects = store.projects;
        if (projects.length === 0) return;
        const activeProject = store.getActiveProject();
        if (!activeProject) return;
        store.openModal({
            type: 'confirm',
            title: 'Delete Project',
            message: `Delete "${activeProject.name}"?`,
            onConfirm: async () => {
                await projectManager.delete(activeProject.id);
                store.deleteProject(activeProject.id);
                persistProjectOrder();
            },
            onCancel: () => {},
        });
        return;
    }

    if (input === 'e') {
        const activeProject = store.getActiveProject();
        if (!activeProject) return;
        store.openModal({
            type: 'input',
            title: 'Rename Project',
            message: `Rename "${activeProject.name}":`,
            defaultValue: activeProject.name,
            onConfirm: async (name) => {
                if (!name.trim()) return;
                store.updateProject(activeProject.id, { name: name.trim() });
                const updated = useStore.getState().getActiveProject();
                if (updated) projectManager.saveDebounced(updated);
            },
            onCancel: () => {},
        });
        return;
    }

    // Settings keybind
    if (input === 's') {
        openSettingsModal(store);
        return;
    }

    // Shift+j/k to reorder projects
    if (input === 'J' || (key.downArrow && key.shift)) {
        const projects = store.projects;
        const currentIdx = projects.findIndex(p => p.id === store.activeProjectId);
        if (currentIdx >= 0 && currentIdx < projects.length - 1) {
            store.swapProjects(currentIdx, currentIdx + 1);
            persistProjectOrder();
        }
        return;
    }
    if (input === 'K' || (key.upArrow && key.shift)) {
        const projects = store.projects;
        const currentIdx = projects.findIndex(p => p.id === store.activeProjectId);
        if (currentIdx > 0) {
            store.swapProjects(currentIdx, currentIdx - 1);
            persistProjectOrder();
        }
        return;
    }

    // j/k/arrows for project switching
    if (input === 'j' || key.downArrow) {
        const projects = store.projects;
        const currentIdx = projects.findIndex(p => p.id === store.activeProjectId);
        if (currentIdx < projects.length - 1) {
            const next = projects[currentIdx + 1];
            store.setActiveProject(next.id);
            restoreLastRequest(next.id, store);
        }
        return;
    }
    if (input === 'k' || key.upArrow) {
        const projects = store.projects;
        const currentIdx = projects.findIndex(p => p.id === store.activeProjectId);
        if (currentIdx > 0) {
            const prev = projects[currentIdx - 1];
            store.setActiveProject(prev.id);
            restoreLastRequest(prev.id, store);
        }
        return;
    }
}

function handleRequestTreeKeys(input: string, key: any, store: ReturnType<typeof useStore.getState>) {
    const project = store.getActiveProject();
    if (!project) return;

    const flatItems = flattenVisibleTree(project.collection);

    if (input === 'a') {
        store.openModal({
            type: 'input',
            title: 'New Request',
            message: 'Enter request name:',
            onConfirm: (name) => {
                if (!name.trim()) return;
                const newRequest: RequestItem = {
                    id: requestId(),
                    type: 'request',
                    name: name.trim(),
                    method: 'GET',
                    url: '',
                    params: [],
                    headers: [],
                    body: { type: 'none', content: '', formData: [] },
                };
                const newCollection = insertNode(project.collection, store.selectedFolderPath, newRequest);
                store.updateCollection(project.id, newCollection);
                store.setSelectedRequest(newRequest.id);
                projectManager.saveDebounced({ ...project, collection: newCollection });
            },
            onCancel: () => {},
        });
        return;
    }

    if (input === 'A') {
        store.openModal({
            type: 'input',
            title: 'New Folder',
            message: 'Enter folder name:',
            onConfirm: (name) => {
                if (!name.trim()) return;
                const newFolder: RequestFolder = {
                    id: folderId(),
                    type: 'folder',
                    name: name.trim(),
                    expanded: true,
                    children: [],
                };
                const newCollection = insertNode(project.collection, null, newFolder);
                store.updateCollection(project.id, newCollection);
                projectManager.saveDebounced({ ...project, collection: newCollection });
            },
            onCancel: () => {},
        });
        return;
    }

    if (input === 'e' && flatItems.length > 0) {
        const selectedId = store.selectedRequestId;
        if (!selectedId) return;
        const node = flatItems.find(f => f.node.id === selectedId);
        if (!node) return;
        store.openModal({
            type: 'input',
            title: 'Rename',
            message: `Rename "${node.node.name}":`,
            defaultValue: node.node.name,
            onConfirm: (name) => {
                if (!name.trim()) return;
                const newCollection = updateNode(project.collection, selectedId, { name: name.trim() });
                store.updateCollection(project.id, newCollection);
                projectManager.saveDebounced({ ...project, collection: newCollection });
            },
            onCancel: () => {},
        });
        return;
    }

    if (input === 'd' && store.selectedRequestId) {
        const selectedId = store.selectedRequestId;
        const node = flatItems.find(f => f.node.id === selectedId);
        if (!node) return;
        store.openModal({
            type: 'confirm',
            title: 'Delete',
            message: `Delete "${node.node.name}"?`,
            onConfirm: () => {
                const newCollection = removeNode(project.collection, selectedId);
                store.updateCollection(project.id, newCollection);
                store.setSelectedRequest(null);
                projectManager.saveDebounced({ ...project, collection: newCollection });
            },
            onCancel: () => {},
        });
        return;
    }

    if (key.return && flatItems.length > 0) {
        const selectedId = store.selectedRequestId;
        if (selectedId) {
            const node = flatItems.find(f => f.node.id === selectedId);
            if (node?.node.type === 'folder') {
                const newCollection = toggleFolder(project.collection, selectedId);
                store.updateCollection(project.id, newCollection);
                projectManager.saveDebounced({ ...project, collection: newCollection });
            } else if (node?.node.type === 'request') {
                store.setFocusedPanel('editor');
            }
        }
        return;
    }

    // Shift+j/k to reorder request tree items
    if (input === 'J' || (key.downArrow && key.shift)) {
        const selectedId = store.selectedRequestId;
        if (!selectedId) return;
        const newCollection = moveNode(project.collection, selectedId, 'down');
        store.updateCollection(project.id, newCollection);
        projectManager.saveDebounced({ ...project, collection: newCollection });
        return;
    }
    if (input === 'K' || (key.upArrow && key.shift)) {
        const selectedId = store.selectedRequestId;
        if (!selectedId) return;
        const newCollection = moveNode(project.collection, selectedId, 'up');
        store.updateCollection(project.id, newCollection);
        projectManager.saveDebounced({ ...project, collection: newCollection });
        return;
    }

    // j/k/arrows for tree navigation
    if (input === 'j' || input === 'k' || key.downArrow || key.upArrow) {
        if (flatItems.length === 0) return;
        const currentIdx = flatItems.findIndex(f => f.node.id === store.selectedRequestId);
        let nextIdx: number;
        if (input === 'j' || key.downArrow) {
            nextIdx = currentIdx < flatItems.length - 1 ? currentIdx + 1 : currentIdx;
        } else {
            nextIdx = currentIdx > 0 ? currentIdx - 1 : 0;
        }
        const nextNode = flatItems[nextIdx];
        if (nextNode) {
            store.setSelectedRequest(nextNode.node.id);
            if (nextNode.node.type === 'folder') {
                store.setSelectedFolderPath(nextNode.node.id);
            }
        }
        return;
    }
}

function getEditorPairs(store: ReturnType<typeof useStore.getState>): KeyValuePair[] | null {
    const request = store.getSelectedRequest();
    if (!request) return null;

    switch (store.editorTab) {
        case 'params': return request.params;
        case 'headers': return request.headers;
        case 'body': return request.body.type === 'form' ? request.body.formData : null;
        default: return null;
    }
}

function saveEditorPairs(store: ReturnType<typeof useStore.getState>, pairs: KeyValuePair[]) {
    const request = store.getSelectedRequest();
    const project = store.getActiveProject();
    if (!request || !project) return;

    let updates: Partial<RequestItem>;
    switch (store.editorTab) {
        case 'params': updates = { params: pairs }; break;
        case 'headers': updates = { headers: pairs }; break;
        case 'body': updates = { body: { ...request.body, formData: pairs } }; break;
        default: return;
    }

    const newCollection = updateNode(project.collection, request.id, updates as any);
    store.updateCollection(project.id, newCollection);
    projectManager.saveDebounced({ ...project, collection: newCollection });
}

function handleEditorKeys(input: string, key: any, store: ReturnType<typeof useStore.getState>) {
    const EDITOR_TABS = ['url', 'params', 'headers', 'body'] as const;
    const BODY_TYPES: RequestBodyType[] = ['none', 'json', 'text', 'form'];

    // Tab switching: [ ] arrows
    if (input === '[') {
        const idx = EDITOR_TABS.indexOf(store.editorTab);
        store.setEditorTab(EDITOR_TABS[(idx - 1 + EDITOR_TABS.length) % EDITOR_TABS.length]);
        return;
    }
    if (input === ']') {
        const idx = EDITOR_TABS.indexOf(store.editorTab);
        store.setEditorTab(EDITOR_TABS[(idx + 1) % EDITOR_TABS.length]);
        return;
    }

    // Global editor keys (work on all tabs)
    if (input === 'y') {
        yankEditorContent(store);
        return;
    }
    if (input === 'R') {
        sendRequest(store);
        return;
    }

    // Tabs without list items use j/k/arrows for tab switching
    const pairs = getEditorPairs(store);
    const hasListItems = pairs !== null && pairs.length > 0;

    if (!hasListItems) {
        if (input === 'j' || key.downArrow) {
            const idx = EDITOR_TABS.indexOf(store.editorTab);
            store.setEditorTab(EDITOR_TABS[(idx + 1) % EDITOR_TABS.length]);
            return;
        }
        if (input === 'k' || key.upArrow) {
            const idx = EDITOR_TABS.indexOf(store.editorTab);
            store.setEditorTab(EDITOR_TABS[(idx - 1 + EDITOR_TABS.length) % EDITOR_TABS.length]);
            return;
        }
    }

    // URL tab keys
    if (store.editorTab === 'url') {
        if (input === 'e') {
            store.setInputMode(true);
            return;
        }
        if (input === 'm') {
            const request = store.getSelectedRequest();
            if (!request) return;
            store.openModal({
                type: 'select',
                title: 'HTTP Method',
                options: [...HTTP_METHODS],
                defaultValue: request.method,
                onConfirm: (method) => {
                    const project = store.getActiveProject();
                    if (!project) return;
                    const newCollection = updateNode(project.collection, request.id, { method: method as HttpMethod });
                    store.updateCollection(project.id, newCollection);
                    projectManager.saveDebounced({ ...project, collection: newCollection });
                },
                onCancel: () => {},
                renderItem: (option, isSelected) => (
                    <Text color={getMethodColor(option as HttpMethod)} bold={isSelected}>
                        {` ${option.padEnd(7)} `}
                    </Text>
                ),
            });
            return;
        }
        return;
    }

    // Body tab: type switcher and text/json content editing
    if (store.editorTab === 'body') {
        const request = store.getSelectedRequest();
        const project = store.getActiveProject();
        if (!request || !project) return;

        if (input === 't') {
            store.openModal({
                type: 'select',
                title: 'Body Type',
                options: BODY_TYPES,
                defaultValue: request.body.type,
                onConfirm: (bodyType) => {
                    const newBody = { ...request.body, type: bodyType as RequestBodyType };
                    const newCollection = updateNode(project.collection, request.id, { body: newBody } as any);
                    store.updateCollection(project.id, newCollection);
                    store.setEditorItemIndex(0);
                    projectManager.saveDebounced({ ...project, collection: newCollection });
                },
                onCancel: () => {},
            });
            return;
        }

        // For non-form body types: e opens inline multi-line editor
        if (input === 'e' && request.body.type !== 'none' && request.body.type !== 'form') {
            store.setInputMode(true);
            return;
        }

        // For form body type, fall through to key-value handling below
        if (request.body.type !== 'form') return;
    }

    // Key-value list tabs: params, headers, body (form)
    if (!pairs) return;

    // j/k and arrows navigate items
    if (input === 'j' || key.downArrow) {
        if (pairs.length > 0) {
            store.setEditorItemIndex(Math.min(store.editorItemIndex + 1, pairs.length - 1));
        }
        return;
    }
    if (input === 'k' || key.upArrow) {
        if (pairs.length > 0) {
            store.setEditorItemIndex(Math.max(store.editorItemIndex - 1, 0));
        }
        return;
    }

    // a: add new key-value pair
    if (input === 'a') {
        store.openModal({
            type: 'input',
            title: 'New Entry',
            message: 'Enter key:',
            onConfirm: (entryKey) => {
                if (!entryKey.trim()) return;
                store.openModal({
                    type: 'input',
                    title: 'New Entry',
                    message: `Value for "${entryKey.trim()}":`,
                    onConfirm: (entryValue) => {
                        const newPair: KeyValuePair = { key: entryKey.trim(), value: entryValue, enabled: true };
                        const currentPairs = getEditorPairs(useStore.getState());
                        if (!currentPairs) return;
                        saveEditorPairs(useStore.getState(), [...currentPairs, newPair]);
                        useStore.getState().setEditorItemIndex(currentPairs.length);
                    },
                    onCancel: () => {},
                });
            },
            onCancel: () => {},
        });
        return;
    }

    // e: edit selected pair (key, then value)
    if (input === 'e') {
        if (pairs.length === 0) return;
        const index = store.editorItemIndex;
        const pair = pairs[index];
        if (!pair) return;
        store.openModal({
            type: 'input',
            title: 'Edit Key',
            message: 'Enter key:',
            defaultValue: pair.key,
            onConfirm: (newKey) => {
                store.openModal({
                    type: 'input',
                    title: 'Edit Value',
                    message: `Value for "${newKey}":`,
                    defaultValue: pair.value,
                    onConfirm: (newValue) => {
                        const currentPairs = getEditorPairs(useStore.getState());
                        if (!currentPairs) return;
                        const updated = [...currentPairs];
                        updated[index] = { ...updated[index], key: newKey, value: newValue };
                        saveEditorPairs(useStore.getState(), updated);
                    },
                    onCancel: () => {},
                });
            },
            onCancel: () => {},
        });
        return;
    }

    // d: delete selected pair
    if (input === 'd') {
        if (pairs.length === 0) return;
        const index = store.editorItemIndex;
        const pair = pairs[index];
        if (!pair) return;
        store.openModal({
            type: 'confirm',
            title: 'Delete Entry',
            message: `Delete "${pair.key || '<empty>'}"?`,
            onConfirm: () => {
                const currentPairs = getEditorPairs(useStore.getState());
                if (!currentPairs) return;
                const updated = currentPairs.filter((_, idx) => idx !== index);
                saveEditorPairs(useStore.getState(), updated);
                const storeNow = useStore.getState();
                if (storeNow.editorItemIndex >= updated.length && updated.length > 0) {
                    storeNow.setEditorItemIndex(updated.length - 1);
                }
            },
            onCancel: () => {},
        });
        return;
    }

    // space: toggle enabled/disabled
    if (input === ' ') {
        if (pairs.length === 0) return;
        const index = store.editorItemIndex;
        const pair = pairs[index];
        if (!pair) return;
        const updated = [...pairs];
        updated[index] = { ...updated[index], enabled: !updated[index].enabled };
        saveEditorPairs(store, updated);
        return;
    }
}

function handleResponseKeys(input: string, key: any, store: ReturnType<typeof useStore.getState>) {
    const RESPONSE_TABS = ['body', 'headers', 'timing', 'history'] as const;

    if (input === '[') {
        const idx = RESPONSE_TABS.indexOf(store.responseTab);
        store.setResponseTab(RESPONSE_TABS[(idx - 1 + RESPONSE_TABS.length) % RESPONSE_TABS.length]);
        return;
    }
    if (input === ']') {
        const idx = RESPONSE_TABS.indexOf(store.responseTab);
        store.setResponseTab(RESPONSE_TABS[(idx + 1) % RESPONSE_TABS.length]);
        return;
    }

    // Up/down arrows cycle response tabs
    if (key.upArrow) {
        const idx = RESPONSE_TABS.indexOf(store.responseTab);
        store.setResponseTab(RESPONSE_TABS[(idx - 1 + RESPONSE_TABS.length) % RESPONSE_TABS.length]);
        return;
    }
    if (key.downArrow) {
        const idx = RESPONSE_TABS.indexOf(store.responseTab);
        store.setResponseTab(RESPONSE_TABS[(idx + 1) % RESPONSE_TABS.length]);
        return;
    }

    if (input === 'y') {
        yankResponseContent(store);
        return;
    }
}

function yankEditorContent(store: ReturnType<typeof useStore.getState>) {
    const request = store.getSelectedRequest();
    if (!request) return;

    let content = "";
    switch (store.editorTab) {
        case "url":
            content = `${request.method} ${request.url}`;
            break;
        case "params":
            content = request.params
                .filter(p => p.enabled)
                .map(p => `${p.key}=${p.value}`)
                .join("\n");
            break;
        case "headers":
            content = request.headers
                .filter(h => h.enabled)
                .map(h => `${h.key}: ${h.value}`)
                .join("\n");
            break;
        case "body":
            if (request.body.type === "form") {
                content = request.body.formData
                    .filter(f => f.enabled)
                    .map(f => `${f.key}=${f.value}`)
                    .join("\n");
            } else if (request.body.type !== "none") {
                content = request.body.content;
            }
            break;
    }

    if (copyToClipboard(content)) {
        store.setStatusMessage("Copied to clipboard");
    }
}

function yankResponseContent(store: ReturnType<typeof useStore.getState>) {
    const response = store.currentResponse;
    if (!response) return;

    let content = "";
    switch (store.responseTab) {
        case "body":
            content = response.response.body;
            break;
        case "headers":
            content = Object.entries(response.response.headers)
                .map(([key, value]) => `${key}: ${value}`)
                .join("\n");
            break;
        case "timing":
            content = [
                `${"Total:".padEnd(14)}${formatDuration(response.timing.duration)}`,
                `${"Started:".padEnd(14)}${new Date(response.timing.startTime).toLocaleTimeString()}`,
                `${"Completed:".padEnd(14)}${new Date(response.timing.endTime).toLocaleTimeString()}`,
            ].join("\n");
            break;
        case "history": {
            const history = store.responseHistory;
            content = history
                .map((entry, index) => {
                    const prefix = index === 0 ? "▸ " : "  ";
                    return `${prefix}${entry.response.status} ${formatDuration(entry.timing.duration)} - ${new Date(entry.timestamp).toLocaleString()}`;
                })
                .join("\n");
            break;
        }
    }

    if (copyToClipboard(content)) {
        store.setStatusMessage("Copied to clipboard");
    }
}

async function sendRequest(store: ReturnType<typeof useStore.getState>) {
    const request = store.getSelectedRequest();
    const project = store.getActiveProject();
    if (!request || !project) return;

    store.setLoading(true);
    store.setError(null);

    try {
        const response = await requestExecutor.execute(request, {
            baseUrl: project.baseUrl,
            defaultHeaders: project.defaultHeaders,
            timeout: store.config.requestTimeout,
        });

        store.setCurrentResponse(response);
        await historyManager.add(request.id, response);
        const history = await historyManager.load(request.id);
        store.setResponseHistory(history);
        store.setLoading(false);
        store.setFocusedPanel('response');
    } catch (err) {
        store.setLoading(false);
        store.setError(err instanceof Error ? err.message : 'Unknown error');
    }
}

function openSettingsModal(store: ReturnType<typeof useStore.getState>) {
    store.openModal({
        type: 'settings',
        title: 'Settings',
        onConfirm: () => {},
        onCancel: () => {},
    });
}

async function persistProjectOrder() {
    const config = await configManager.load();
    config.projectOrder = useStore.getState().projects.map(p => p.id);
    await configManager.save(config);
}

function restoreLastRequest(projectId: string, store: ReturnType<typeof useStore.getState>) {
    const config = store.config;
    const lastRequestId = config.lastRequestMap?.[projectId] ?? null;
    store.setSelectedRequest(lastRequestId);
}
