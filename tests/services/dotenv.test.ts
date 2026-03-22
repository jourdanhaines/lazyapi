import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseDotEnv, discoverDotEnvFiles, loadDotEnv } from "../../src/utils/dotenv";

describe("parseDotEnv", () => {
    it("parses basic KEY=VALUE pairs", () => {
        const result = parseDotEnv("HOST=localhost\nPORT=3000");
        expect(result).toEqual({ HOST: "localhost", PORT: "3000" });
    });

    it("ignores comments and empty lines", () => {
        const result = parseDotEnv("# comment\n\nKEY=value\n  # another comment");
        expect(result).toEqual({ KEY: "value" });
    });

    it("strips double quotes from values", () => {
        const result = parseDotEnv('SECRET="my secret value"');
        expect(result).toEqual({ SECRET: "my secret value" });
    });

    it("strips single quotes from values", () => {
        const result = parseDotEnv("SECRET='my secret value'");
        expect(result).toEqual({ SECRET: "my secret value" });
    });

    it("handles export prefix", () => {
        const result = parseDotEnv("export API_KEY=abc123");
        expect(result).toEqual({ API_KEY: "abc123" });
    });

    it("handles values with equals signs", () => {
        const result = parseDotEnv("CONNECTION=host=localhost;port=5432");
        expect(result).toEqual({ CONNECTION: "host=localhost;port=5432" });
    });

    it("handles empty values", () => {
        const result = parseDotEnv("EMPTY=");
        expect(result).toEqual({ EMPTY: "" });
    });

    it("trims whitespace around keys and values", () => {
        const result = parseDotEnv("  KEY  =  value  ");
        expect(result).toEqual({ KEY: "value" });
    });

    it("returns empty object for empty content", () => {
        expect(parseDotEnv("")).toEqual({});
        expect(parseDotEnv("\n\n")).toEqual({});
    });
});

describe("discoverDotEnvFiles", () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'lazyapi-test-'));
    });

    afterEach(async () => {
        await rm(tmpDir, { recursive: true });
    });

    it("finds .env and .env.* files", async () => {
        await writeFile(join(tmpDir, '.env'), 'A=1');
        await writeFile(join(tmpDir, '.env.local'), 'B=2');
        await writeFile(join(tmpDir, '.env.production'), 'C=3');
        await writeFile(join(tmpDir, 'unrelated.txt'), 'nope');

        const files = await discoverDotEnvFiles(tmpDir);
        expect(files).toEqual(['.env', '.env.local', '.env.production']);
    });

    it("sorts .env first, then alphabetically", async () => {
        await writeFile(join(tmpDir, '.env.z'), 'Z=1');
        await writeFile(join(tmpDir, '.env'), 'BASE=1');
        await writeFile(join(tmpDir, '.env.a'), 'A=1');

        const files = await discoverDotEnvFiles(tmpDir);
        expect(files).toEqual(['.env', '.env.a', '.env.z']);
    });

    it("returns empty for directory with no .env files", async () => {
        const files = await discoverDotEnvFiles(tmpDir);
        expect(files).toEqual([]);
    });
});

describe("loadDotEnv", () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'lazyapi-test-'));
    });

    afterEach(async () => {
        await rm(tmpDir, { recursive: true });
    });

    it("merges all .env files with later files overriding earlier ones", async () => {
        await writeFile(join(tmpDir, '.env'), 'HOST=base\nPORT=3000');
        await writeFile(join(tmpDir, '.env.local'), 'HOST=local\nSECRET=abc');

        const vars = await loadDotEnv(tmpDir);
        expect(vars.HOST).toBe('local');
        expect(vars.PORT).toBe('3000');
        expect(vars.SECRET).toBe('abc');
    });

    it("returns empty when no .env files exist", async () => {
        const vars = await loadDotEnv(tmpDir);
        expect(vars).toEqual({});
    });
});
