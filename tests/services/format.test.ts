import { describe, it, expect } from "vitest";
import { formatBytes, formatDuration, truncate } from "../../src/utils/format";

describe('format utils', () => {
    describe('formatBytes', () => {
        it('should format bytes', () => {
            expect(formatBytes(500)).toBe('500 B');
        });

        it('should format kilobytes', () => {
            expect(formatBytes(1500)).toBe('1.5 KB');
        });

        it('should format megabytes', () => {
            expect(formatBytes(1500000)).toBe('1.4 MB');
        });
    });

    describe('formatDuration', () => {
        it('should format milliseconds', () => {
            expect(formatDuration(150)).toBe('150ms');
        });

        it('should format seconds', () => {
            expect(formatDuration(1500)).toBe('1.50s');
        });
    });

    describe('truncate', () => {
        it('should not truncate short strings', () => {
            expect(truncate('hello', 10)).toBe('hello');
        });

        it('should truncate long strings', () => {
            expect(truncate('hello world', 8)).toBe('hello w…');
        });
    });
});
