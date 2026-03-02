import { storageManager } from "./StorageManager";
import type { Project } from "../types/project";
import { projectId } from "../utils/id";

export class ProjectManager {
    async loadAll(): Promise<Project[]> {
        const files = await storageManager.list('projects');
        const projects: Project[] = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const project = await storageManager.read<Project>(`projects/${file}`);
                if (project) projects.push(project);
            }
        }
        return projects;
    }

    async save(project: Project): Promise<void> {
        await storageManager.write(`projects/${project.id}.json`, project);
    }

    saveDebounced(project: Project): void {
        storageManager.writeDebounced(`projects/${project.id}.json`, project);
    }

    async create(name: string, baseUrl = ''): Promise<Project> {
        const project: Project = {
            id: projectId(),
            name,
            baseUrl,
            defaultHeaders: [],
            collection: [],
        };
        await this.save(project);
        return project;
    }

    async delete(id: string): Promise<void> {
        await storageManager.delete(`projects/${id}.json`);
    }
}

export const projectManager = new ProjectManager();
