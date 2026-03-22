import type { KeyValuePair } from "./request";

export interface Environment {
    id: string;
    name: string;
    variables: KeyValuePair[];
    baseUrl?: string;
    defaultHeaders?: KeyValuePair[];
}
