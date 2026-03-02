import { storageManager } from "./StorageManager";
import { DEFAULT_CONFIG, type GlobalConfig } from "../types/config";

const CONFIG_PATH = 'config.json';

export class ConfigManager {
    async load(): Promise<GlobalConfig> {
        const stored = await storageManager.read<Partial<GlobalConfig>>(CONFIG_PATH);
        if (!stored) {
            await this.save(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
        return { ...DEFAULT_CONFIG, ...stored, ui: { ...DEFAULT_CONFIG.ui, ...(stored.ui ?? {}) } };
    }

    async save(config: GlobalConfig): Promise<void> {
        await storageManager.write(CONFIG_PATH, config);
    }

    async update(updates: Partial<GlobalConfig>): Promise<GlobalConfig> {
        const current = await this.load();
        const updated = { ...current, ...updates };
        await this.save(updated);
        return updated;
    }

    async mapDirectory(directory: string, projectId: string): Promise<void> {
        const config = await this.load();
        config.directoryMap[directory] = projectId;
        await this.save(config);
    }

    async detectProject(cwd: string): Promise<string | null> {
        const config = await this.load();

        // Exact match
        if (config.directoryMap[cwd]) {
            return config.directoryMap[cwd];
        }

        // Walk up parent directories
        let dir = cwd;
        while (true) {
            const parent = dir.substring(0, dir.lastIndexOf('/'));
            if (parent === dir || parent === '') break;
            dir = parent;
            if (config.directoryMap[dir]) {
                return config.directoryMap[dir];
            }
        }

        // Fall back to last project
        return config.lastProjectId;
    }
}

export const configManager = new ConfigManager();
