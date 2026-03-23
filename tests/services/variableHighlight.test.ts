import { describe, it, expect } from "vitest";
import { tokenizeVariables, classifyVariables, detectVariableAtCursor } from "../../src/utils/variableHighlight";

describe("tokenizeVariables", () => {
    it("splits text into plain and variable tokens", () => {
        const tokens = tokenizeVariables("https://{{host}}/api/{{path}}");
        expect(tokens).toHaveLength(4);
        expect(tokens[0]).toEqual({ text: "https://", type: "text" });
        expect(tokens[1]).toEqual({ text: "{{host}}", type: "variable", variableName: "host" });
        expect(tokens[2]).toEqual({ text: "/api/", type: "text" });
        expect(tokens[3]).toEqual({ text: "{{path}}", type: "variable", variableName: "path" });
    });

    it("handles text with no variables", () => {
        const tokens = tokenizeVariables("plain text");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({ text: "plain text", type: "text" });
    });

    it("handles variable-only text", () => {
        const tokens = tokenizeVariables("{{var}}");
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe("variable");
    });

    it("trims whitespace in variable names", () => {
        const tokens = tokenizeVariables("{{ host }}");
        expect(tokens[0].variableName).toBe("host");
    });
});

describe("classifyVariables", () => {
    it("marks valid variables", () => {
        const tokens = tokenizeVariables("{{host}}/{{missing}}");
        const classified = classifyVariables(tokens, { host: "localhost" });
        expect(classified[0].isValid).toBe(true);
        expect(classified[1]).toEqual({ text: "/", type: "text" });
        expect(classified[2].isValid).toBe(false);
    });
});

describe("detectVariableAtCursor", () => {
    it("detects cursor inside variable braces", () => {
        const result = detectVariableAtCursor("{{hos}}", 5);
        expect(result).not.toBeNull();
        expect(result!.partialName).toBe("hos");
        expect(result!.startOffset).toBe(0);
        expect(result!.endOffset).toBe(7);
    });

    it("returns null when cursor is outside variables", () => {
        expect(detectVariableAtCursor("text {{var}}", 3)).toBeNull();
    });

    it("returns null when cursor is after closed variable", () => {
        expect(detectVariableAtCursor("{{var}} text", 8)).toBeNull();
    });

    it("detects partial variable without closing braces", () => {
        const result = detectVariableAtCursor("{{hos", 5);
        expect(result).not.toBeNull();
        expect(result!.partialName).toBe("hos");
    });

    it("detects cursor at start of variable name", () => {
        const result = detectVariableAtCursor("{{}}", 2);
        expect(result).not.toBeNull();
        expect(result!.partialName).toBe("");
    });
});
