export interface UIConfig {
    sidebarWidth: number;
    theme: string;
    showAppBackground: boolean;
}

export interface GlobalConfig {
    version: string;
    historyLimit: number;
    lastProjectId: string | null;
    lastRequestMap: Record<string, string>;
    directoryMap: Record<string, string>;
    projectOrder: string[];
    requestTimeout: number;
    ui: UIConfig;
}

export const DEFAULT_CONFIG: GlobalConfig = {
    version: '1.0.0',
    historyLimit: 10,
    lastProjectId: null,
    lastRequestMap: {},
    directoryMap: {},
    projectOrder: [],
    requestTimeout: 30000,
    ui: {
        sidebarWidth: 30,
        theme: 'default',
        showAppBackground: false,
    },
};
