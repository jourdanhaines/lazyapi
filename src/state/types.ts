import type { PanelId, EditorTab, ResponseTab, ModalState } from "../types/ui";
import type { Project } from "../types/project";
import type { Environment } from "../types/environment";
import type { RequestItem, RequestTreeNode } from "../types/request";
import type { ResponseEntry } from "../types/response";
import type { GlobalConfig } from "../types/config";
import type { Theme } from "../types/theme";

export interface UISlice {
    focusedPanel: PanelId;
    editorTab: EditorTab;
    editorItemIndex: number;
    responseTab: ResponseTab;
    modal: ModalState | null;
    inputMode: boolean;
    statusMessage: string | null;
    setFocusedPanel: (panel: PanelId) => void;
    nextPanel: () => void;
    prevPanel: () => void;
    setEditorTab: (tab: EditorTab) => void;
    setEditorItemIndex: (index: number) => void;
    setResponseTab: (tab: ResponseTab) => void;
    openModal: (modal: ModalState) => void;
    closeModal: () => void;
    setInputMode: (active: boolean) => void;
    setStatusMessage: (message: string | null) => void;
}

export interface ProjectSlice {
    projects: Project[];
    activeProjectId: string | null;
    setProjects: (projects: Project[]) => void;
    setActiveProject: (id: string | null) => void;
    addProject: (project: Project) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    swapProjects: (indexA: number, indexB: number) => void;
    getActiveProject: () => Project | null;
    setActiveEnvironment: (projectId: string, envId: string | null) => void;
    getActiveEnvironment: () => Environment | null;
}

export interface RequestSlice {
    selectedRequestId: string | null;
    selectedFolderPath: string | null;
    setSelectedRequest: (id: string | null) => void;
    setSelectedFolderPath: (id: string | null) => void;
    getSelectedRequest: () => RequestItem | null;
    updateCollection: (projectId: string, collection: RequestTreeNode[]) => void;
}

export interface ResponseSlice {
    currentResponse: ResponseEntry | null;
    responseHistory: ResponseEntry[];
    isLoading: boolean;
    error: string | null;
    setCurrentResponse: (response: ResponseEntry | null) => void;
    setResponseHistory: (history: ResponseEntry[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export interface ConfigSlice {
    config: GlobalConfig;
    dotEnvVars: Record<string, string>;
    dotEnvLoaded: boolean;
    setConfig: (config: GlobalConfig) => void;
    updateConfig: (updates: Partial<GlobalConfig>) => void;
    setDotEnvVars: (vars: Record<string, string>) => void;
}

export interface ThemeSlice {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export type StoreState = UISlice & ProjectSlice & RequestSlice & ResponseSlice & ConfigSlice & ThemeSlice;
