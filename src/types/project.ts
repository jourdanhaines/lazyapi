import type { KeyValuePair, RequestTreeNode } from "./request";

export interface Project {
    id: string;
    name: string;
    baseUrl: string;
    defaultHeaders: KeyValuePair[];
    collection: RequestTreeNode[];
}
