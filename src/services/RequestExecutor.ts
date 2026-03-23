import type { RequestItem, KeyValuePair } from "../types/request";
import type { ResponseEntry, ResponseTiming } from "../types/response";
import { buildUrl, normalizeHeaders } from "../utils/http";
import { responseId } from "../utils/id";

export interface ExecuteOptions {
    defaultHeaders: KeyValuePair[];
    timeout: number;
}

export class RequestExecutor {
    async execute(request: RequestItem, options: ExecuteOptions): Promise<ResponseEntry> {
        const url = buildUrl(request.url, request.params);
        const headers = {
            ...normalizeHeaders(options.defaultHeaders),
            ...normalizeHeaders(request.headers),
        };

        let bodyContent: string | undefined;
        if (request.body.type !== 'none' && !['GET', 'HEAD'].includes(request.method)) {
            switch (request.body.type) {
                case 'json':
                    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
                    bodyContent = request.body.content;
                    break;
                case 'text':
                    headers['Content-Type'] = headers['Content-Type'] || 'text/plain';
                    bodyContent = request.body.content;
                    break;
                case 'form': {
                    const formData = new URLSearchParams();
                    for (const item of request.body.formData) {
                        if (item.enabled && item.key) {
                            formData.append(item.key, item.value);
                        }
                    }
                    headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded';
                    bodyContent = formData.toString();
                    break;
                }
            }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        const startTime = Date.now();
        try {
            const res = await fetch(url, {
                method: request.method,
                headers,
                body: bodyContent,
                signal: controller.signal,
            });

            const responseBody = await res.text();
            const endTime = Date.now();
            clearTimeout(timeoutId);

            const responseHeaders: Record<string, string> = {};
            res.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            const timing: ResponseTiming = {
                startTime,
                endTime,
                duration: endTime - startTime,
            };

            return {
                id: responseId(),
                requestId: request.id,
                timestamp: startTime,
                request: {
                    method: request.method,
                    url,
                    headers,
                    body: bodyContent,
                },
                response: {
                    status: res.status,
                    statusText: res.statusText,
                    headers: responseHeaders,
                    body: responseBody,
                    size: new TextEncoder().encode(responseBody).length,
                },
                timing,
            };
        } catch (err) {
            clearTimeout(timeoutId);
            const endTime = Date.now();
            const message = err instanceof Error ? err.message : 'Unknown error';
            throw new Error(`Request failed: ${message} (${endTime - startTime}ms)\nData:\n${JSON.stringify({
                url, method: request.method, headers,
                body: bodyContent
            }, null, 4)}`);
        }
    }
}

export const requestExecutor = new RequestExecutor();
