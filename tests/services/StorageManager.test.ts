import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StorageManager } from "../../src/services/StorageManager";

describe('StorageManager', () => {
    let storage: StorageManager;
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), 'lazyapi-test-'));
        process.env['XDG_CONFIG_HOME'] = tempDir;
        storage = new StorageManager();
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
        delete process.env['XDG_CONFIG_HOME'];
    });

    it('should create directories', async () => {
        await storage.ensureDirectories();
        const { existsSync } = await import('node:fs');
        expect(existsSync(join(tempDir, 'lazyapi', 'projects'))).toBe(true);
        expect(existsSync(join(tempDir, 'lazyapi', 'history'))).toBe(true);
    });

    it('should write and read JSON', async () => {
        await storage.ensureDirectories();
        const data = { name: 'test', value: 42 };
        await storage.write('test.json', data);
        const result = await storage.read<typeof data>('test.json');
        expect(result).toEqual(data);
    });

    it('should return null for missing files', async () => {
        await storage.ensureDirectories();
        const result = await storage.read('nonexistent.json');
        expect(result).toBeNull();
    });

    it('should delete files', async () => {
        await storage.ensureDirectories();
        await storage.write('todelete.json', { data: true });
        await storage.delete('todelete.json');
        const result = await storage.read('todelete.json');
        expect(result).toBeNull();
    });

    it('should list files in a directory', async () => {
        await storage.ensureDirectories();
        await storage.write('projects/p1.json', { id: 'p1' });
        await storage.write('projects/p2.json', { id: 'p2' });
        const files = await storage.list('projects');
        expect(files).toContain('p1.json');
        expect(files).toContain('p2.json');
    });
});
