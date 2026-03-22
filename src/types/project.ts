import type { KeyValuePair, RequestTreeNode } from "./request";
import type { Environment } from "./environment";

export type StorageMode = 'local' | 'git';

export interface Project {
    id: string;
    name: string;
    baseUrl: string;
    defaultHeaders: KeyValuePair[];
    collection: RequestTreeNode[];
    environments: Environment[];
    activeEnvironmentId: string | null;
    storageMode: StorageMode;
    gitDir?: string;
}
