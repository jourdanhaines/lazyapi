import { describe, it, expect } from "vitest";
import {
    flattenVisibleTree,
    findNode,
    insertNode,
    removeNode,
    updateNode,
    toggleFolder,
} from "../../src/utils/tree";
import type { RequestTreeNode, RequestItem, RequestFolder } from "../../src/types/request";

const makeRequest = (id: string, name: string): RequestItem => ({
    id,
    type: 'request',
    name,
    method: 'GET',
    url: '',
    params: [],
    headers: [],
    body: { type: 'none', content: '', formData: [] },
});

const makeFolder = (id: string, name: string, children: RequestTreeNode[], expanded = true): RequestFolder => ({
    id,
    type: 'folder',
    name,
    expanded,
    children,
});

describe('tree utils', () => {
    const tree: RequestTreeNode[] = [
        makeRequest('r1', 'Request 1'),
        makeFolder('f1', 'Folder 1', [
            makeRequest('r2', 'Request 2'),
            makeRequest('r3', 'Request 3'),
        ]),
        makeRequest('r4', 'Request 4'),
    ];

    describe('flattenVisibleTree', () => {
        it('should flatten visible nodes', () => {
            const flat = flattenVisibleTree(tree);
            expect(flat).toHaveLength(5);
            expect(flat.map(f => f.node.id)).toEqual(['r1', 'f1', 'r2', 'r3', 'r4']);
        });

        it('should hide children of collapsed folders', () => {
            const collapsed = [
                makeRequest('r1', 'Request 1'),
                makeFolder('f1', 'Folder 1', [
                    makeRequest('r2', 'Request 2'),
                ], false),
            ];
            const flat = flattenVisibleTree(collapsed);
            expect(flat).toHaveLength(2);
            expect(flat.map(f => f.node.id)).toEqual(['r1', 'f1']);
        });

        it('should track depth', () => {
            const flat = flattenVisibleTree(tree);
            expect(flat[0].depth).toBe(0);
            expect(flat[1].depth).toBe(0);
            expect(flat[2].depth).toBe(1);
            expect(flat[3].depth).toBe(1);
            expect(flat[4].depth).toBe(0);
        });
    });

    describe('findNode', () => {
        it('should find top-level nodes', () => {
            expect(findNode(tree, 'r1')?.id).toBe('r1');
        });

        it('should find nested nodes', () => {
            expect(findNode(tree, 'r2')?.id).toBe('r2');
        });

        it('should return null for missing nodes', () => {
            expect(findNode(tree, 'missing')).toBeNull();
        });
    });

    describe('insertNode', () => {
        it('should insert at root level', () => {
            const newNode = makeRequest('r5', 'Request 5');
            const result = insertNode(tree, null, newNode);
            expect(result).toHaveLength(4);
            expect(result[3].id).toBe('r5');
        });

        it('should insert into a folder', () => {
            const newNode = makeRequest('r5', 'Request 5');
            const result = insertNode(tree, 'f1', newNode);
            const folder = result.find(n => n.id === 'f1') as RequestFolder;
            expect(folder.children).toHaveLength(3);
            expect(folder.children[2].id).toBe('r5');
        });
    });

    describe('removeNode', () => {
        it('should remove top-level nodes', () => {
            const result = removeNode(tree, 'r1');
            expect(result).toHaveLength(2);
        });

        it('should remove nested nodes', () => {
            const result = removeNode(tree, 'r2');
            const folder = result.find(n => n.id === 'f1') as RequestFolder;
            expect(folder.children).toHaveLength(1);
        });
    });

    describe('updateNode', () => {
        it('should update node properties', () => {
            const result = updateNode(tree, 'r1', { name: 'Updated' });
            expect((result[0] as RequestItem).name).toBe('Updated');
        });
    });

    describe('toggleFolder', () => {
        it('should toggle folder expanded state', () => {
            const result = toggleFolder(tree, 'f1');
            const folder = result.find(n => n.id === 'f1') as RequestFolder;
            expect(folder.expanded).toBe(false);
        });
    });
});
