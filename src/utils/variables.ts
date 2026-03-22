import type { KeyValuePair, RequestItem, RequestTreeNode } from "../types/request";
import type { ResponseEntry } from "../types/response";
import { findNodeByName } from "./tree";

const VAR_REGEX = /\{\{([^}]+)\}\}/g;
const CROSS_REF_REGEX = /\{\{([^}]+\.response\.[^}]+)\}\}/g;

export interface InterpolationResult {
    result: string;
    unresolvedVars: string[];
}

export interface ResolvedRequest {
    resolved: RequestItem;
    unresolvedVars: string[];
}

export function interpolate(
    template: string,
    context: Record<string, string>,
    crossRequestResolver?: (ref: string) => string | undefined
): InterpolationResult {
    const unresolvedVars: string[] = [];

    const result = template.replace(VAR_REGEX, (match, key: string) => {
        const trimmed = key.trim();

        if (trimmed in context) {
            return context[trimmed];
        }

        if (crossRequestResolver) {
            const resolved = crossRequestResolver(trimmed);
            if (resolved !== undefined) return resolved;
        }

        unresolvedVars.push(trimmed);
        return match;
    });

    return { result, unresolvedVars };
}

export function buildVariableContext(
    envVars: KeyValuePair[],
    dotEnvVars: Record<string, string>
): Record<string, string> {
    const context: Record<string, string> = { ...dotEnvVars };

    for (const v of envVars) {
        if (v.enabled && v.key) {
            context[v.key] = v.value;
        }
    }

    return context;
}

function interpolatePairs(
    pairs: KeyValuePair[],
    context: Record<string, string>,
    crossRequestResolver?: (ref: string) => string | undefined
): { pairs: KeyValuePair[]; unresolvedVars: string[] } {
    const unresolvedVars: string[] = [];

    const result = pairs.map(pair => {
        const keyResult = interpolate(pair.key, context, crossRequestResolver);
        const valueResult = interpolate(pair.value, context, crossRequestResolver);
        unresolvedVars.push(...keyResult.unresolvedVars, ...valueResult.unresolvedVars);
        return { ...pair, key: keyResult.result, value: valueResult.result };
    });

    return { pairs: result, unresolvedVars };
}

export function resolveRequest(
    request: RequestItem,
    context: Record<string, string>,
    crossRequestResolver?: (ref: string) => string | undefined
): ResolvedRequest {
    const allUnresolved: string[] = [];

    const urlResult = interpolate(request.url, context, crossRequestResolver);
    allUnresolved.push(...urlResult.unresolvedVars);

    const paramsResult = interpolatePairs(request.params, context, crossRequestResolver);
    allUnresolved.push(...paramsResult.unresolvedVars);

    const headersResult = interpolatePairs(request.headers, context, crossRequestResolver);
    allUnresolved.push(...headersResult.unresolvedVars);

    const contentResult = interpolate(request.body.content, context, crossRequestResolver);
    allUnresolved.push(...contentResult.unresolvedVars);

    const formResult = interpolatePairs(request.body.formData, context, crossRequestResolver);
    allUnresolved.push(...formResult.unresolvedVars);

    const resolved: RequestItem = {
        ...request,
        url: urlResult.result,
        params: paramsResult.pairs,
        headers: headersResult.pairs,
        body: {
            ...request.body,
            content: contentResult.result,
            formData: formResult.pairs,
        },
    };

    const unresolvedVars = [...new Set(allUnresolved)];

    return { resolved, unresolvedVars };
}

export function extractCrossRequestRefs(request: RequestItem): string[] {
    const names = new Set<string>();
    const fields = [
        request.url,
        request.body.content,
        ...request.params.map(p => `${p.key}${p.value}`),
        ...request.headers.map(h => `${h.key}${h.value}`),
        ...request.body.formData.map(f => `${f.key}${f.value}`),
    ];

    for (const field of fields) {
        let match: RegExpExecArray | null;
        CROSS_REF_REGEX.lastIndex = 0;
        while ((match = CROSS_REF_REGEX.exec(field)) !== null) {
            const ref = match[1].trim();
            const dotIndex = ref.indexOf('.response.');
            if (dotIndex > 0) {
                names.add(ref.slice(0, dotIndex));
            }
        }
    }

    return [...names];
}

export function resolveResponsePath(entry: ResponseEntry, path: string): string | undefined {
    const parts = path.split('.');
    if (parts[0] !== 'response' || parts.length < 2) return undefined;

    if (parts[1] === 'headers') {
        const headerName = parts.slice(2).join('.');
        const headerValue = entry.response.headers[headerName]
            ?? entry.response.headers[headerName.toLowerCase()];
        return headerValue !== undefined ? String(headerValue) : undefined;
    }

    if (parts[1] === 'body') {
        try {
            let value: unknown = JSON.parse(entry.response.body);
            for (const part of parts.slice(2)) {
                if (value === null || value === undefined) return undefined;
                if (typeof value === 'object') {
                    value = (value as Record<string, unknown>)[part];
                } else {
                    return undefined;
                }
            }
            if (value === null || value === undefined) return undefined;
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
        } catch {
            return undefined;
        }
    }

    if (parts[1] === 'status') {
        return String(entry.response.status);
    }

    if (parts[1] === 'statusText') {
        return entry.response.statusText;
    }

    return undefined;
}

export function createCrossRequestResolver(
    collection: RequestTreeNode[],
    historyCache: Map<string, ResponseEntry[]>
): (ref: string) => string | undefined {
    return (ref: string) => {
        const dotIndex = ref.indexOf('.response.');
        if (dotIndex <= 0) return undefined;

        const requestName = ref.slice(0, dotIndex);
        const path = ref.slice(dotIndex + 1);

        const entries = historyCache.get(requestName);
        if (!entries || entries.length === 0) return undefined;

        return resolveResponsePath(entries[0], path);
    };
}
