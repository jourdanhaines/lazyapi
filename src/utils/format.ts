export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

export function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + '…';
}

export function getResponseSyntax(headers: Record<string, string>): "json" | "none" {
    const contentType = Object.entries(headers).find(
        ([key]) => key.toLowerCase() === "content-type"
    )?.[1] ?? "";
    return contentType.includes("json") ? "json" : "none";
}

const MAX_PRETTY_PRINT = 1048576;

export function formatResponseBody(body: string, syntax: "json" | "none", maxSize = MAX_PRETTY_PRINT): string {
    if (!body) return "";
    if (syntax !== "json") return body;

    try {
        if (body.length <= maxSize) {
            const parsed = JSON.parse(body);
            return JSON.stringify(parsed, null, 4);
        }
        return body;
    } catch {
        return body;
    }
}
