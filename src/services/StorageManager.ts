import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export class StorageManager {
    private baseDir: string;
    private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor() {
        const configHome = process.env['XDG_CONFIG_HOME'] || join(homedir(), '.config');
        this.baseDir = join(configHome, 'lazyapi');
    }

    getBaseDir(): string {
        return this.baseDir;
    }

    async ensureDirectories(): Promise<void> {
        await mkdir(join(this.baseDir, 'projects'), { recursive: true });
        await mkdir(join(this.baseDir, 'history'), { recursive: true });
        await mkdir(join(this.baseDir, 'themes'), { recursive: true });
    }

    async read<T>(relativePath: string): Promise<T | null> {
        const fullPath = join(this.baseDir, relativePath);
        try {
            const data = await readFile(fullPath, 'utf-8');
            return JSON.parse(data) as T;
        } catch {
            return null;
        }
    }

    async write<T>(relativePath: string, data: T): Promise<void> {
        const fullPath = join(this.baseDir, relativePath);
        const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
        const tmpPath = fullPath + '.tmp';
        await writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
        const { rename } = await import('node:fs/promises');
        await rename(tmpPath, fullPath);
    }

    writeDebounced<T>(relativePath: string, data: T, delayMs = 500): void {
        const existing = this.debounceTimers.get(relativePath);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
            this.write(relativePath, data).catch(() => {});
            this.debounceTimers.delete(relativePath);
        }, delayMs);
        this.debounceTimers.set(relativePath, timer);
    }

    async flushAll(): Promise<void> {
        for (const [key, timer] of this.debounceTimers) {
            clearTimeout(timer);
            this.debounceTimers.delete(key);
        }
    }

    async delete(relativePath: string): Promise<void> {
        const fullPath = join(this.baseDir, relativePath);
        try {
            const { unlink } = await import('node:fs/promises');
            await unlink(fullPath);
        } catch {
            // File may not exist
        }
    }

    async list(relativePath: string): Promise<string[]> {
        const fullPath = join(this.baseDir, relativePath);
        try {
            const { readdir } = await import('node:fs/promises');
            return await readdir(fullPath);
        } catch {
            return [];
        }
    }
}

export const storageManager = new StorageManager();
