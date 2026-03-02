import { nanoid } from "nanoid";

export function generateId(prefix: string): string {
    return `${prefix}_${nanoid(12)}`;
}

export function projectId(): string {
    return generateId('proj');
}

export function requestId(): string {
    return generateId('req');
}

export function folderId(): string {
    return generateId('fold');
}

export function responseId(): string {
    return generateId('resp');
}
