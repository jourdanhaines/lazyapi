import type { HttpMethod } from "../types/request";

export function getMethodColor(method: HttpMethod): string {
    switch (method) {
        case 'GET': return 'green';
        case 'POST': return 'yellow';
        case 'PUT': return 'blue';
        case 'PATCH': return 'magenta';
        case 'DELETE': return 'red';
        case 'HEAD': return 'cyan';
        case 'OPTIONS': return 'gray';
    }
}

export function getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'green';
    if (status >= 300 && status < 400) return 'cyan';
    if (status >= 400 && status < 500) return 'yellow';
    if (status >= 500) return 'red';
    return 'gray';
}
