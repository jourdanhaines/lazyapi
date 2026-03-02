export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export interface KeyValuePair {
    key: string;
    value: string;
    enabled: boolean;
}

export type RequestBodyType = 'none' | 'json' | 'text' | 'form';

export interface RequestBody {
    type: RequestBodyType;
    content: string;
    formData: KeyValuePair[];
}

export interface RequestItem {
    id: string;
    type: 'request';
    name: string;
    method: HttpMethod;
    url: string;
    params: KeyValuePair[];
    headers: KeyValuePair[];
    body: RequestBody;
}

export interface RequestFolder {
    id: string;
    type: 'folder';
    name: string;
    expanded: boolean;
    children: RequestTreeNode[];
}

export type RequestTreeNode = RequestItem | RequestFolder;
