import { storageManager } from "./StorageManager";
import { BUILTIN_THEMES, DEFAULT_THEME_NAME, type Theme } from "../types/theme";

export class ThemeManager {
    async ensureDirectory(): Promise<void> {
        const { mkdir } = await import('node:fs/promises');
        const { join } = await import('node:path');
        await mkdir(join(storageManager.getBaseDir(), 'themes'), { recursive: true });
    }

    async loadTheme(name: string): Promise<Theme> {
        // Check builtins first
        if (BUILTIN_THEMES[name]) {
            return BUILTIN_THEMES[name];
        }

        // Try loading from user themes directory
        const custom = await storageManager.read<Theme>(`themes/${name}.json`);
        if (custom) {
            return custom;
        }

        return BUILTIN_THEMES[DEFAULT_THEME_NAME];
    }

    async saveCustomTheme(theme: Theme): Promise<void> {
        const key = theme.name.toLowerCase().replace(/\s+/g, '-');
        await storageManager.write(`themes/${key}.json`, theme);
    }

    async listAvailable(): Promise<string[]> {
        const builtinNames = Object.keys(BUILTIN_THEMES);
        const customFiles = await storageManager.list('themes');
        const customNames = customFiles
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));

        // Deduplicate (builtins take priority)
        const all = new Set([...builtinNames, ...customNames]);
        return [...all];
    }
}

export const themeManager = new ThemeManager();
