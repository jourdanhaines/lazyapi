import { storageManager } from "./StorageManager";
import { gitProjectManager } from "./GitProjectManager";
import type { Project } from "../types/project";
import { projectId } from "../utils/id";

export class ProjectManager {
    async loadAll(): Promise<Project[]> {
        const files = await storageManager.list('projects');
        const projects: Project[] = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const raw = await storageManager.read<Record<string, unknown>>(`projects/${file}`);
                if (raw) projects.push(this.migrate(raw));
            }
        }
        return projects;
    }

    private migrate(raw: Record<string, unknown>): Project {
        return {
            ...raw,
            environments: raw.environments ?? [],
            activeEnvironmentId: raw.activeEnvironmentId ?? null,
            storageMode: raw.storageMode ?? 'local',
        } as Project;
    }

    async save(project: Project): Promise<void> {
        if (project.storageMode === 'git' && project.gitDir) {
            await gitProjectManager.saveProject(project.gitDir, project);
        } else {
            await storageManager.write(`projects/${project.id}.json`, project);
        }
    }

    saveDebounced(project: Project): void {
        if (project.storageMode === 'git' && project.gitDir) {
            gitProjectManager.saveProjectDebounced(project.gitDir, project);
        } else {
            storageManager.writeDebounced(`projects/${project.id}.json`, project);
        }
    }

    async create(name: string, baseUrl = ''): Promise<Project> {
        const project: Project = {
            id: projectId(),
            name,
            baseUrl,
            defaultHeaders: [],
            collection: [],
            environments: [],
            activeEnvironmentId: null,
            storageMode: 'local',
        };
        await this.save(project);
        return project;
    }

    async delete(id: string): Promise<void> {
        await storageManager.delete(`projects/${id}.json`);
    }
}

export const projectManager = new ProjectManager();
