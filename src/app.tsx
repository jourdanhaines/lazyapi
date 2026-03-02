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

interface AppProps {
    projectName?: string;
}

export function App({ projectName }: AppProps) {
    const store = useStore();

    const { exit } = useApp();

    useKeybindings(() => {
        storageManager.flushAll().then(() => exit());
    });

    useEffect(() => {
        async function init() {
            await storageManager.ensureDirectories();
            await themeManager.ensureDirectory();

            const config = await configManager.load();
            store.setConfig(config);
            historyManager.setLimit(config.historyLimit);

            // Load theme
            const theme = await themeManager.loadTheme(config.ui.theme);
            store.setTheme(theme);

            const projects = await projectManager.loadAll();
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

    // Persist selected request across restarts
    useEffect(() => {
        let prevRequestId: string | null = null;
        return useStore.subscribe((state) => {
            const { activeProjectId, selectedRequestId } = state;
            if (selectedRequestId === prevRequestId) return;
            prevRequestId = selectedRequestId;
            if (!activeProjectId || !selectedRequestId) return;
            configManager.load().then((config) => {
                config.lastRequestMap = config.lastRequestMap ?? {};
                config.lastRequestMap[activeProjectId] = selectedRequestId;
                configManager.save(config);
            });
        });
    }, []);

    // Graceful shutdown
    useEffect(() => {
        const cleanup = () => {
            storageManager.flushAll();
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
