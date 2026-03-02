import { create } from "zustand";
import type { StoreState } from "./types";
import { PANEL_ORDER, type PanelId } from "../types/ui";
import { DEFAULT_CONFIG } from "../types/config";
import { BUILTIN_THEMES, DEFAULT_THEME_NAME } from "../types/theme";
import type { RequestItem } from "../types/request";
import { findNode } from "../utils/tree";

export const useStore = create<StoreState>((set, get) => ({
    // UI Slice
    focusedPanel: 'projects' as PanelId,
    editorTab: 'url' as const,
    editorItemIndex: 0,
    responseTab: 'body' as const,
    modal: null,
    inputMode: false,
    statusMessage: null,

    setFocusedPanel: (panel) => set({ focusedPanel: panel }),
    nextPanel: () => set(state => {
        const idx = PANEL_ORDER.indexOf(state.focusedPanel);
        return { focusedPanel: PANEL_ORDER[(idx + 1) % PANEL_ORDER.length] };
    }),
    prevPanel: () => set(state => {
        const idx = PANEL_ORDER.indexOf(state.focusedPanel);
        return { focusedPanel: PANEL_ORDER[(idx - 1 + PANEL_ORDER.length) % PANEL_ORDER.length] };
    }),
    setEditorTab: (tab) => set({ editorTab: tab, editorItemIndex: 0 }),
    setEditorItemIndex: (index) => set({ editorItemIndex: index }),
    setResponseTab: (tab) => set({ responseTab: tab }),
    openModal: (modal) => set({ modal }),
    closeModal: () => set({ modal: null }),
    setInputMode: (active) => set({ inputMode: active }),
    setStatusMessage: (message) => set({ statusMessage: message }),

    // Project Slice
    projects: [],
    activeProjectId: null,

    setProjects: (projects) => set({ projects }),
    setActiveProject: (id) => set({ activeProjectId: id }),
    addProject: (project) => set(state => ({
        projects: [...state.projects, project],
    })),
    updateProject: (id, updates) => set(state => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
    })),
    deleteProject: (id) => set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    })),
    swapProjects: (indexA, indexB) => set(state => {
        const projects = [...state.projects];
        if (indexA < 0 || indexB < 0 || indexA >= projects.length || indexB >= projects.length) return state;
        [projects[indexA], projects[indexB]] = [projects[indexB], projects[indexA]];
        return { projects };
    }),
    getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find(p => p.id === activeProjectId) ?? null;
    },

    // Request Slice
    selectedRequestId: null,
    selectedFolderPath: null,

    setSelectedRequest: (id) => set({ selectedRequestId: id }),
    setSelectedFolderPath: (id) => set({ selectedFolderPath: id }),
    getSelectedRequest: () => {
        const { selectedRequestId } = get();
        if (!selectedRequestId) return null;
        const project = get().getActiveProject();
        if (!project) return null;
        const node = findNode(project.collection, selectedRequestId);
        if (node && node.type === 'request') return node as RequestItem;
        return null;
    },
    updateCollection: (projectId, collection) => set(state => ({
        projects: state.projects.map(p =>
            p.id === projectId ? { ...p, collection } : p
        ),
    })),

    // Response Slice
    currentResponse: null,
    responseHistory: [],
    isLoading: false,
    error: null,

    setCurrentResponse: (response) => set({ currentResponse: response }),
    setResponseHistory: (history) => set({ responseHistory: history }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // Config Slice
    config: DEFAULT_CONFIG,

    setConfig: (config) => set({ config }),
    updateConfig: (updates) => set(state => ({
        config: { ...state.config, ...updates },
    })),

    // Theme Slice
    theme: BUILTIN_THEMES[DEFAULT_THEME_NAME],

    setTheme: (theme) => set({ theme }),
}));
