import { describe, it, expect } from "vitest";
import { buildUrl, normalizeHeaders, parseUrl } from "../../src/utils/http";

describe('http utils', () => {
    describe('buildUrl', () => {
        it('should combine base and path', () => {
            expect(buildUrl('https://api.example.com', '/users', [])).toBe('https://api.example.com/users');
        });

        it('should handle base with trailing slash', () => {
            expect(buildUrl('https://api.example.com/', '/users', [])).toBe('https://api.example.com//users');
        });

        it('should add query params', () => {
            const params = [
                { key: 'page', value: '1', enabled: true },
                { key: 'limit', value: '10', enabled: true },
            ];
            const result = buildUrl('https://api.example.com', '/users', params);
            expect(result).toBe('https://api.example.com/users?page=1&limit=10');
        });

        it('should use full URL in path when base is empty', () => {
            expect(buildUrl('', 'https://api.example.com/health', [])).toBe('https://api.example.com/health');
        });

        it('should use full URL in path even when base is set', () => {
            expect(buildUrl('https://other.com', 'https://api.example.com/health', [])).toBe('https://api.example.com/health');
        });

        it('should skip disabled params', () => {
            const params = [
                { key: 'page', value: '1', enabled: true },
                { key: 'debug', value: 'true', enabled: false },
            ];
            const result = buildUrl('https://api.example.com', '/users', params);
            expect(result).toBe('https://api.example.com/users?page=1');
        });
    });

    describe('normalizeHeaders', () => {
        it('should convert enabled pairs to object', () => {
            const headers = [
                { key: 'Content-Type', value: 'application/json', enabled: true },
                { key: 'X-Debug', value: 'true', enabled: false },
            ];
            const result = normalizeHeaders(headers);
            expect(result).toEqual({ 'Content-Type': 'application/json' });
        });
    });

    describe('parseUrl', () => {
        it('should extract query params', () => {
            const result = parseUrl('https://api.example.com/users?page=1&limit=10');
            expect(result.params).toHaveLength(2);
            expect(result.params[0]).toEqual({ key: 'page', value: '1', enabled: true });
        });

        it('should handle URLs without params', () => {
            const result = parseUrl('https://api.example.com/users');
            expect(result.params).toHaveLength(0);
        });
    });
});
