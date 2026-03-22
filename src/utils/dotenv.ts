import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export function parseDotEnv(content: string): Record<string, string> {
    const vars: Record<string, string> = {};

    for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();

        if (!line || line.startsWith('#')) continue;

        const stripped = line.startsWith('export ') ? line.slice(7).trim() : line;
        const eqIndex = stripped.indexOf('=');
        if (eqIndex === -1) continue;

        const key = stripped.slice(0, eqIndex).trim();
        let value = stripped.slice(eqIndex + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (key) vars[key] = value;
    }

    return vars;
}

export async function discoverDotEnvFiles(cwd: string): Promise<string[]> {
    try {
        const entries = await readdir(cwd);
        return entries
            .filter(name => name === '.env' || name.startsWith('.env.'))
            .sort((a, b) => {
                if (a === '.env') return -1;
                if (b === '.env') return 1;
                return a.localeCompare(b);
            });
    } catch {
        return [];
    }
}

export async function loadDotEnv(cwd: string): Promise<Record<string, string>> {
    const files = await discoverDotEnvFiles(cwd);
    const vars: Record<string, string> = {};

    for (const file of files) {
        try {
            const content = await readFile(join(cwd, file), 'utf-8');
            const parsed = parseDotEnv(content);
            Object.assign(vars, parsed);
        } catch {
            // skip unreadable files
        }
    }

    return vars;
}
