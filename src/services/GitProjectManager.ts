import { readFile, writeFile, mkdir, access, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { Project } from "../types/project";
import type { Environment } from "../types/environment";
import type { KeyValuePair } from "../types/request";
import { environmentId } from "../utils/id";

const LAZYAPI_DIR = '.lazyapi';
const PROJECT_FILE = 'project.json';
const SECRETS_FILE = 'secrets.json';
const GITIGNORE_FILE = '.gitignore';

type SecretsMap = Record<string, KeyValuePair[]>;

export class GitProjectManager {
    private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

    async detectGitProject(cwd: string): Promise<string | null> {
        let dir = cwd;
        while (true) {
            const lazyapiDir = join(dir, LAZYAPI_DIR);
            try {
                await access(join(lazyapiDir, PROJECT_FILE));
                return lazyapiDir;
            } catch {
                const parent = dirname(dir);
                if (parent === dir) break;
                dir = parent;
            }
        }
        return null;
    }

    async loadProject(lazyapiDir: string): Promise<Project | null> {
        try {
            const raw = JSON.parse(await readFile(join(lazyapiDir, PROJECT_FILE), 'utf-8'));

            const environments = (raw.environments ?? []) as Environment[];
            let activeEnvironmentId = (raw.activeEnvironmentId ?? null) as string | null;

            const baseUrl = raw.baseUrl as string | undefined;
            if (baseUrl) {
                let defaultEnv = environments.find(e => e.name === 'default');
                if (!defaultEnv) {
                    defaultEnv = { id: environmentId(), name: 'default', variables: [] };
                    environments.push(defaultEnv);
                }
                const hasBaseUrl = defaultEnv.variables.some(v => v.key === 'BASE_URL');
                if (!hasBaseUrl) {
                    defaultEnv.variables.push({ key: 'BASE_URL', value: baseUrl, enabled: true });
                }
                if (!activeEnvironmentId) {
                    activeEnvironmentId = defaultEnv.id;
                }
            }

            const project: Project = {
                ...raw,
                environments,
                activeEnvironmentId,
                storageMode: 'git',
                gitDir: lazyapiDir,
            };

            const secrets = await this.loadSecrets(lazyapiDir);
            if (secrets) {
                project.environments = project.environments.map(env =>
                    this.mergeSecrets(env, secrets[env.id] ?? [])
                );
            }

            return project;
        } catch {
            return null;
        }
    }

    async saveProject(lazyapiDir: string, project: Project): Promise<void> {
        const { sanitized, secrets } = this.separateSecrets(project);

        const projectData = { ...sanitized };
        delete (projectData as Record<string, unknown>).gitDir;

        await writeFile(join(lazyapiDir, PROJECT_FILE), JSON.stringify(projectData, null, 4), 'utf-8');

        if (Object.keys(secrets).length > 0) {
            await writeFile(join(lazyapiDir, SECRETS_FILE), JSON.stringify(secrets, null, 4), 'utf-8');
        }
    }

    saveProjectDebounced(lazyapiDir: string, project: Project): void {
        const existing = this.debounceTimers.get(lazyapiDir);
        if (existing) clearTimeout(existing);

        this.debounceTimers.set(lazyapiDir, setTimeout(() => {
            this.saveProject(lazyapiDir, project);
            this.debounceTimers.delete(lazyapiDir);
        }, 500));
    }

    async initGitDir(targetDir: string): Promise<string> {
        const lazyapiDir = join(targetDir, LAZYAPI_DIR);
        await mkdir(lazyapiDir, { recursive: true });
        await this.ensureGitignore(lazyapiDir);
        return lazyapiDir;
    }

    async ensureGitignore(lazyapiDir: string): Promise<void> {
        const gitignorePath = join(lazyapiDir, GITIGNORE_FILE);
        try {
            const content = await readFile(gitignorePath, 'utf-8');
            if (!content.includes(SECRETS_FILE)) {
                await writeFile(gitignorePath, content.trimEnd() + '\n' + SECRETS_FILE + '\n', 'utf-8');
            }
        } catch {
            await writeFile(gitignorePath, SECRETS_FILE + '\n', 'utf-8');
        }
    }

    async flushAll(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const [lazyapiDir, timer] of this.debounceTimers) {
            clearTimeout(timer);
            this.debounceTimers.delete(lazyapiDir);
        }
        await Promise.all(promises);
    }

    private async loadSecrets(lazyapiDir: string): Promise<SecretsMap | null> {
        try {
            const content = await readFile(join(lazyapiDir, SECRETS_FILE), 'utf-8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    private separateSecrets(project: Project): { sanitized: Project; secrets: SecretsMap } {
        const secrets: SecretsMap = {};

        const sanitizedEnvs = project.environments.map(env => {
            const secretVars = env.variables.filter(v => v.isSecret);
            const publicVars = env.variables.filter(v => !v.isSecret);

            if (secretVars.length > 0) {
                secrets[env.id] = secretVars;
            }

            return { ...env, variables: publicVars };
        });

        return {
            sanitized: { ...project, environments: sanitizedEnvs },
            secrets,
        };
    }

    private mergeSecrets(env: Environment, secretVars: KeyValuePair[]): Environment {
        if (secretVars.length === 0) return env;

        const existingKeys = new Set(env.variables.map(v => v.key));
        const newSecrets = secretVars.filter(s => !existingKeys.has(s.key));

        return {
            ...env,
            variables: [...env.variables, ...newSecrets.map(s => ({ ...s, isSecret: true }))],
        };
    }
}

export const gitProjectManager = new GitProjectManager();
