import { describe, it, expect } from "vitest";
import { fuzzyMatch, fuzzyFilter } from "../../src/utils/fuzzyMatch";

describe("fuzzyMatch", () => {
    it("matches exact prefix", () => {
        const result = fuzzyMatch("BASE", "BASE_URL");
        expect(result).not.toBeNull();
        expect(result!.matchedIndices).toEqual([0, 1, 2, 3]);
        expect(result!.score).toBeGreaterThan(50);
    });

    it("matches fuzzy characters", () => {
        const result = fuzzyMatch("bu", "BASE_URL");
        expect(result).not.toBeNull();
        expect(result!.matchedIndices).toEqual([0, 5]);
    });

    it("returns null when no match", () => {
        expect(fuzzyMatch("xyz", "BASE_URL")).toBeNull();
    });

    it("matches case-insensitively", () => {
        const result = fuzzyMatch("base", "BASE_URL");
        expect(result).not.toBeNull();
    });

    it("gives higher score to prefix matches", () => {
        const prefix = fuzzyMatch("base", "BASE_URL")!;
        const fuzzy = fuzzyMatch("base", "MY_BASE_URL")!;
        expect(prefix.score).toBeGreaterThan(fuzzy.score);
    });
});

describe("fuzzyFilter", () => {
    const candidates = ["BASE_URL", "BASE_API_URL", "BASE_TRPC_URL", "API_KEY"];

    it("returns all candidates for empty query", () => {
        const results = fuzzyFilter("", candidates);
        expect(results).toHaveLength(4);
    });

    it("filters to matching candidates", () => {
        const results = fuzzyFilter("base", candidates);
        expect(results).toHaveLength(3);
        expect(results.map(r => r.name)).not.toContain("API_KEY");
    });

    it("ranks prefix matches higher", () => {
        const results = fuzzyFilter("base_u", candidates);
        expect(results[0].name).toBe("BASE_URL");
    });

    it("returns empty for no matches", () => {
        const results = fuzzyFilter("xyz", candidates);
        expect(results).toHaveLength(0);
    });

    it("matches base_a only to BASE_API_URL", () => {
        const results = fuzzyFilter("base_a", candidates);
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("BASE_API_URL");
    });
});
