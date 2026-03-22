import { describe, it, expect } from "vitest";
import { interpolate, buildVariableContext, resolveRequest, extractCrossRequestRefs, resolveResponsePath, createCrossRequestResolver } from "../../src/utils/variables";
import type { RequestItem } from "../../src/types/request";
import type { ResponseEntry } from "../../src/types/response";

describe("interpolate", () => {
    it("replaces a single variable", () => {
        const { result, unresolvedVars } = interpolate("https://{{host}}/api", { host: "example.com" });
        expect(result).toBe("https://example.com/api");
        expect(unresolvedVars).toEqual([]);
    });

    it("replaces multiple variables", () => {
        const { result } = interpolate("{{scheme}}://{{host}}/{{path}}", {
            scheme: "https",
            host: "api.test.com",
            path: "v1/users",
        });
        expect(result).toBe("https://api.test.com/v1/users");
    });

    it("leaves unresolved variables as-is", () => {
        const { result, unresolvedVars } = interpolate("{{host}}/{{missing}}", { host: "example.com" });
        expect(result).toBe("example.com/{{missing}}");
        expect(unresolvedVars).toEqual(["missing"]);
    });

    it("returns empty unresolvedVars when all resolved", () => {
        const { unresolvedVars } = interpolate("no variables here", {});
        expect(unresolvedVars).toEqual([]);
    });

    it("trims whitespace in variable names", () => {
        const { result } = interpolate("{{ host }}", { host: "example.com" });
        expect(result).toBe("example.com");
    });

    it("uses crossRequestResolver as fallback", () => {
        const resolver = (ref: string) => ref === "Login.response.body.token" ? "abc123" : undefined;
        const { result } = interpolate("Bearer {{Login.response.body.token}}", {}, resolver);
        expect(result).toBe("Bearer abc123");
    });

    it("prefers context over crossRequestResolver", () => {
        const resolver = () => "from-resolver";
        const { result } = interpolate("{{key}}", { key: "from-context" }, resolver);
        expect(result).toBe("from-context");
    });
});

describe("buildVariableContext", () => {
    it("merges env vars over dotenv vars", () => {
        const envVars = [
            { key: "API_KEY", value: "env-key", enabled: true },
            { key: "HOST", value: "env-host", enabled: true },
        ];
        const dotEnvVars = { API_KEY: "dotenv-key", OTHER: "dotenv-other" };
        const context = buildVariableContext(envVars, dotEnvVars);
        expect(context.API_KEY).toBe("env-key");
        expect(context.HOST).toBe("env-host");
        expect(context.OTHER).toBe("dotenv-other");
    });

    it("skips disabled env vars", () => {
        const envVars = [
            { key: "DISABLED", value: "nope", enabled: false },
            { key: "ENABLED", value: "yes", enabled: true },
        ];
        const context = buildVariableContext(envVars, {});
        expect(context.DISABLED).toBeUndefined();
        expect(context.ENABLED).toBe("yes");
    });
});

describe("resolveRequest", () => {
    const baseRequest: RequestItem = {
        id: "req_test",
        type: "request",
        name: "Test",
        method: "GET",
        url: "{{baseUrl}}/users/{{userId}}",
        params: [{ key: "token", value: "{{apiToken}}", enabled: true }],
        headers: [{ key: "Authorization", value: "Bearer {{apiToken}}", enabled: true }],
        body: {
            type: "json",
            content: '{"user": "{{userId}}"}',
            formData: [],
        },
    };

    it("resolves variables across all fields", () => {
        const context = { baseUrl: "https://api.test.com", userId: "42", apiToken: "tok123" };
        const { resolved, unresolvedVars } = resolveRequest(baseRequest, context);
        expect(resolved.url).toBe("https://api.test.com/users/42");
        expect(resolved.params[0].value).toBe("tok123");
        expect(resolved.headers[0].value).toBe("Bearer tok123");
        expect(resolved.body.content).toBe('{"user": "42"}');
        expect(unresolvedVars).toEqual([]);
    });

    it("collects unique unresolved variables", () => {
        const { unresolvedVars } = resolveRequest(baseRequest, {});
        expect(unresolvedVars).toContain("baseUrl");
        expect(unresolvedVars).toContain("userId");
        expect(unresolvedVars).toContain("apiToken");
    });

    it("does not mutate the original request", () => {
        const context = { baseUrl: "https://api.test.com", userId: "42", apiToken: "tok123" };
        resolveRequest(baseRequest, context);
        expect(baseRequest.url).toBe("{{baseUrl}}/users/{{userId}}");
    });
});

describe("extractCrossRequestRefs", () => {
    it("extracts request names from cross-request references", () => {
        const request: RequestItem = {
            id: "req_test",
            type: "request",
            name: "Test",
            method: "GET",
            url: "/users",
            params: [],
            headers: [{ key: "Authorization", value: "Bearer {{Login.response.body.token}}", enabled: true }],
            body: { type: "json", content: '{"ref": "{{GetUser.response.body.id}}"}', formData: [] },
        };
        const refs = extractCrossRequestRefs(request);
        expect(refs).toContain("Login");
        expect(refs).toContain("GetUser");
        expect(refs).toHaveLength(2);
    });

    it("returns empty for no cross-request refs", () => {
        const request: RequestItem = {
            id: "req_test",
            type: "request",
            name: "Test",
            method: "GET",
            url: "{{baseUrl}}/users",
            params: [],
            headers: [],
            body: { type: "none", content: "", formData: [] },
        };
        expect(extractCrossRequestRefs(request)).toEqual([]);
    });
});

describe("resolveResponsePath", () => {
    const entry: ResponseEntry = {
        id: "resp_test",
        requestId: "req_test",
        timestamp: Date.now(),
        request: { method: "POST", url: "https://api.test.com/login", headers: {} },
        response: {
            status: 200,
            statusText: "OK",
            headers: { "content-type": "application/json", "x-request-id": "abc123" },
            body: JSON.stringify({ token: "jwt-token", user: { id: 42, name: "Test" } }),
            size: 100,
        },
        timing: { startTime: 0, endTime: 100, duration: 100 },
    };

    it("resolves body paths", () => {
        expect(resolveResponsePath(entry, "response.body.token")).toBe("jwt-token");
        expect(resolveResponsePath(entry, "response.body.user.id")).toBe("42");
        expect(resolveResponsePath(entry, "response.body.user.name")).toBe("Test");
    });

    it("resolves nested objects as JSON strings", () => {
        const result = resolveResponsePath(entry, "response.body.user");
        expect(result).toBe(JSON.stringify({ id: 42, name: "Test" }));
    });

    it("resolves headers", () => {
        expect(resolveResponsePath(entry, "response.headers.x-request-id")).toBe("abc123");
    });

    it("resolves status", () => {
        expect(resolveResponsePath(entry, "response.status")).toBe("200");
    });

    it("returns undefined for missing paths", () => {
        expect(resolveResponsePath(entry, "response.body.nonexistent")).toBeUndefined();
        expect(resolveResponsePath(entry, "response.headers.missing")).toBeUndefined();
    });
});

describe("createCrossRequestResolver", () => {
    const entry: ResponseEntry = {
        id: "resp_login",
        requestId: "req_login",
        timestamp: Date.now(),
        request: { method: "POST", url: "/login", headers: {} },
        response: {
            status: 200,
            statusText: "OK",
            headers: {},
            body: JSON.stringify({ token: "my-jwt" }),
            size: 50,
        },
        timing: { startTime: 0, endTime: 50, duration: 50 },
    };

    const collection = [
        { id: "req_login", type: "request" as const, name: "Login", method: "POST" as const, url: "/login", params: [], headers: [], body: { type: "json" as const, content: "", formData: [] } },
    ];

    it("resolves a cross-request reference", () => {
        const cache = new Map([["Login", [entry]]]);
        const resolver = createCrossRequestResolver(collection, cache);
        expect(resolver("Login.response.body.token")).toBe("my-jwt");
    });

    it("returns undefined for unknown request names", () => {
        const cache = new Map<string, ResponseEntry[]>();
        const resolver = createCrossRequestResolver(collection, cache);
        expect(resolver("Unknown.response.body.token")).toBeUndefined();
    });
});
