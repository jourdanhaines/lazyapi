import React, { useEffect } from "react";
import { useApp } from "ink";
import { Layout } from "./components/layout/Layout";
import { useKeybindings } from "./hooks/useKeybindings";
import { useStore } from "./state/store";
import { storageManager } from "./services/StorageManager";
import { configManager } from "./services/ConfigManager";
import { projectManager } from "./services/ProjectManager";
import { historyManager } from "./services/HistoryManager";
import { themeManager } from "./services/ThemeManager";
import { gitProjectManager } from "./services/GitProjectManager";
import { loadDotEnv } from "./utils/dotenv";

interface AppProps {
    projectName?: string;
}

export function App({ projectName }: AppProps) {
    const store = useStore();

    const { exit } = useApp();

    useKeybindings(() => {
        Promise.all([storageManager.flushAll(), gitProjectManager.flushAll()]).then(() => exit());
    });

    useEffect(() => {
        async function init() {
            await storageManager.ensureDirectories();
            await themeManager.ensureDirectory();

            const config = await configManager.load();
            store.setConfig(config);
            historyManager.setLimit(config.historyLimit);

            const dotEnvVars = await loadDotEnv(process.cwd());
            store.setDotEnvVars(dotEnvVars);

            // Load theme
            const theme = await themeManager.loadTheme(config.ui.theme);
            store.setTheme(theme);

            const projects = await projectManager.loadAll();

            // Load git-based project from cwd if present
            const gitDir = await gitProjectManager.detectGitProject(process.cwd());
            if (gitDir) {
                const gitProject = await gitProjectManager.loadProject(gitDir);
                if (gitProject) {
                    const existingIndex = projects.findIndex(p => p.id === gitProject.id);
                    if (existingIndex >= 0) {
                        projects[existingIndex] = gitProject;
                    } else {
                        projects.push(gitProject);
                    }
                }
            }

            // Sort projects by persisted order
            if (config.projectOrder.length > 0) {
                const orderMap = new Map(config.projectOrder.map((id, index) => [id, index]));
                projects.sort((a, b) => {
                    const orderA = orderMap.get(a.id) ?? Infinity;
                    const orderB = orderMap.get(b.id) ?? Infinity;
                    return orderA - orderB;
                });
            }
            store.setProjects(projects);

            if (projectName) {
                const match = projects.find(p => p.name === projectName);
                if (match) {
                    store.setActiveProject(match.id);
                    const lastRequestId = config.lastRequestMap?.[match.id];
                    if (lastRequestId) {
                        store.setSelectedRequest(lastRequestId);
                    }
                    return;
                }
            }

            const detectedId = await configManager.detectProject(process.cwd());
            let activeId: string | null = null;
            if (detectedId && projects.find(p => p.id === detectedId)) {
                activeId = detectedId;
            } else if (projects.length > 0) {
                activeId = projects[0].id;
            }

            if (activeId) {
                store.setActiveProject(activeId);
                const lastRequestId = config.lastRequestMap?.[activeId];
                if (lastRequestId) {
                    store.setSelectedRequest(lastRequestId);
                }
            }
        }

        init();
    }, []);

    // Persist selected request and load last response on selection change
    useEffect(() => {
        let prevRequestId: string | null = null;
        return useStore.subscribe((state) => {
            const { activeProjectId, selectedRequestId } = state;
            if (selectedRequestId === prevRequestId) return;
            prevRequestId = selectedRequestId;
            if (!activeProjectId || !selectedRequestId) {
                const current = useStore.getState();
                current.setCurrentResponse(null);
                current.setResponseHistory([]);
                current.setError(null);
                return;
            }

            configManager.load().then((config) => {
                config.lastRequestMap = config.lastRequestMap ?? {};
                config.lastRequestMap[activeProjectId] = selectedRequestId;
                configManager.save(config);
            });

            historyManager.load(selectedRequestId).then((history) => {
                const current = useStore.getState();
                if (current.selectedRequestId !== selectedRequestId) return;
                current.setResponseHistory(history);
                current.setCurrentResponse(history[0] ?? null);
                current.setError(null);
            });
        });
    }, []);

    // Graceful shutdown
    useEffect(() => {
        const cleanup = () => {
            storageManager.flushAll();
            gitProjectManager.flushAll();
        };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        return () => {
            process.off('SIGINT', cleanup);
            process.off('SIGTERM', cleanup);
        };
    }, []);

    return <Layout />;
}
