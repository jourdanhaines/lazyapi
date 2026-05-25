import { storageManager } from "./services/StorageManager";
import { configManager } from "./services/ConfigManager";
import { projectManager } from "./services/ProjectManager";
import { gitProjectManager } from "./services/GitProjectManager";
import { historyManager } from "./services/HistoryManager";
import { requestExecutor } from "./services/RequestExecutor";
import { loadDotEnv } from "./utils/dotenv";
import { findNode, findNodeByName } from "./utils/tree";
import {
    buildVariableContext,
    resolveRequest,
    extractCrossRequestRefs,
    createCrossRequestResolver,
} from "./utils/variables";
import type { Project } from "./types/project";
import type { RequestItem, RequestTreeNode } from "./types/request";
import type { ResponseEntry } from "./types/response";

interface BootstrapResult {
    projects: Project[];
    dotEnvVars: Record<string, string>;
    timeout: number;
}

async function loadAllProjects(): Promise<Project[]> {
    const projects = await projectManager.loadAll();
    const gitDir = await gitProjectManager.detectGitProject(process.cwd());
    if (gitDir) {
        const gitProject = await gitProjectManager.loadProject(gitDir);
        if (gitProject) {
            const existingIndex = projects.findIndex(p => p.id === gitProject.id);
            if (existingIndex >= 0) {
                projects[existingIndex] = gitProject;
            } else {
                projects.push(gitProject);
            }
        }
    }
    return projects;
}

async function bootstrap(): Promise<BootstrapResult> {
    await storageManager.ensureDirectories();
    const config = await configManager.load();
    historyManager.setLimit(config.historyLimit);
    const dotEnvVars = await loadDotEnv(process.cwd());
    const projects = await loadAllProjects();
    return { projects, dotEnvVars, timeout: config.requestTimeout };
}

interface FlatRequest {
    id: string;
    name: string;
    method: string;
    url: string;
    path: string;
}

function flattenRequests(nodes: RequestTreeNode[], folderPath: string[] = []): FlatRequest[] {
    const out: FlatRequest[] = [];
    for (const node of nodes) {
        if (node.type === 'folder') {
            out.push(...flattenRequests(node.children, [...folderPath, node.name]));
            continue;
        }
        out.push({
            id: node.id,
            name: node.name,
            method: node.method,
            url: node.url,
            path: folderPath.join('/'),
        });
    }
    return out;
}

function writeStdoutJson(value: unknown): void {
    process.stdout.write(JSON.stringify(value) + '\n');
}

function writeStderrJson(value: unknown): void {
    process.stderr.write(JSON.stringify(value) + '\n');
}

export async function listProjects(): Promise<number> {
    const { projects } = await bootstrap();
    const out = projects.map(project => {
        const activeEnv = project.environments.find(e => e.id === project.activeEnvironmentId);
        return {
            id: project.id,
            name: project.name,
            requestCount: flattenRequests(project.collection).length,
            activeEnvironment: activeEnv?.name ?? null,
            storageMode: project.storageMode,
        };
    });
    writeStdoutJson({ projects: out });
    return 0;
}

export async function listRequests(projectName: string): Promise<number> {
    const { projects } = await bootstrap();
    const project = projects.find(p => p.name === projectName);
    if (!project) {
        writeStderrJson({ error: 'project_not_found', name: projectName });
        return 3;
    }
    writeStdoutJson({
        project: project.name,
        requests: flattenRequests(project.collection),
    });
    return 0;
}

interface RunOptions {
    project: string;
    request: string;
    env?: string;
}

export async function runHeadless(opts: RunOptions): Promise<number> {
    const { projects, dotEnvVars, timeout } = await bootstrap();

    const project = projects.find(p => p.name === opts.project);
    if (!project) {
        writeStderrJson({ error: 'project_not_found', name: opts.project });
        return 3;
    }

    const node = findNode(project.collection, opts.request);
    if (!node || node.type !== 'request') {
        writeStderrJson({ error: 'request_not_found', id: opts.request });
        return 4;
    }
    const request: RequestItem = node;

    let env;
    if (opts.env) {
        env = project.environments.find(e => e.name === opts.env);
        if (!env) {
            writeStderrJson({ error: 'environment_not_found', name: opts.env });
            return 5;
        }
    } else {
        env = project.environments.find(e => e.id === project.activeEnvironmentId);
    }

    const defaultHeaders = [
        ...project.defaultHeaders,
        ...(env?.defaultHeaders ?? []),
    ];
    const variableContext = buildVariableContext(env?.variables ?? [], dotEnvVars);

    const refNames = extractCrossRequestRefs(request);
    const historyCache = new Map<string, ResponseEntry[]>();
    await Promise.all(refNames.map(async (name) => {
        const refNode = findNodeByName(project.collection, name);
        if (refNode) {
            const entries = await historyManager.load(refNode.id);
            historyCache.set(name, entries);
        }
    }));
    const crossResolver = refNames.length > 0
        ? createCrossRequestResolver(project.collection, historyCache)
        : undefined;

    const { resolved, unresolvedVars } = resolveRequest(request, variableContext, crossResolver);
    if (unresolvedVars.length > 0) {
        writeStderrJson({ error: 'unresolved_variables', vars: unresolvedVars });
        return 6;
    }

    let response: ResponseEntry;
    try {
        response = await requestExecutor.execute(resolved, { defaultHeaders, timeout });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        writeStderrJson({ error: 'network', message });
        return 7;
    }

    await historyManager.add(request.id, response);
    writeStdoutJson(response);
    return 0;
}
