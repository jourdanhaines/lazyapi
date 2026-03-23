import type { KeyValuePair } from "../types/request";

export function buildUrl(url: string, params: KeyValuePair[]): string {
    const enabledParams = params.filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        for (const p of enabledParams) {
            searchParams.append(p.key, p.value);
        }
        url += (url.includes('?') ? '&' : '?') + searchParams.toString();
    }

    return url;
}

export function normalizeHeaders(headers: KeyValuePair[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const h of headers) {
        if (h.enabled && h.key) {
            result[h.key] = h.value;
        }
    }
    return result;
}

export function parseUrl(url: string): { base: string; params: KeyValuePair[] } {
    try {
        const u = new URL(url);
        const params: KeyValuePair[] = [];
        u.searchParams.forEach((value, key) => {
            params.push({ key, value, enabled: true });
        });
        u.search = '';
        return { base: u.toString(), params };
    } catch {
        return { base: url, params: [] };
    }
}
