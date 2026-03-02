import type { RequestTreeNode, RequestItem, RequestFolder } from "../types/request";

export interface FlatTreeItem {
    node: RequestTreeNode;
    depth: number;
    path: number[];
}

export function flattenVisibleTree(nodes: RequestTreeNode[], depth = 0, path: number[] = []): FlatTreeItem[] {
    const result: FlatTreeItem[] = [];
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const currentPath = [...path, i];
        result.push({ node, depth, path: currentPath });
        if (node.type === 'folder' && node.expanded) {
            result.push(...flattenVisibleTree(node.children, depth + 1, currentPath));
        }
    }
    return result;
}

export function findNode(nodes: RequestTreeNode[], id: string): RequestTreeNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.type === 'folder') {
            const found = findNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function insertNode(nodes: RequestTreeNode[], parentId: string | null, newNode: RequestTreeNode): RequestTreeNode[] {
    if (parentId === null) {
        return [...nodes, newNode];
    }
    return nodes.map(node => {
        if (node.id === parentId && node.type === 'folder') {
            return { ...node, children: [...node.children, newNode] };
        }
        if (node.type === 'folder') {
            return { ...node, children: insertNode(node.children, parentId, newNode) };
        }
        return node;
    });
}

export function removeNode(nodes: RequestTreeNode[], id: string): RequestTreeNode[] {
    return nodes
        .filter(node => node.id !== id)
        .map(node => {
            if (node.type === 'folder') {
                return { ...node, children: removeNode(node.children, id) };
            }
            return node;
        });
}

export function updateNode(nodes: RequestTreeNode[], id: string, updates: Partial<RequestItem> | Partial<RequestFolder>): RequestTreeNode[] {
    return nodes.map(node => {
        if (node.id === id) {
            return { ...node, ...updates } as RequestTreeNode;
        }
        if (node.type === 'folder') {
            return { ...node, children: updateNode(node.children, id, updates) };
        }
        return node;
    });
}

export function moveNode(nodes: RequestTreeNode[], id: string, direction: 'up' | 'down'): RequestTreeNode[] {
    const idx = nodes.findIndex(n => n.id === id);
    if (idx !== -1) {
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= nodes.length) return nodes;
        const result = [...nodes];
        [result[idx], result[targetIdx]] = [result[targetIdx], result[idx]];
        return result;
    }
    return nodes.map(node => {
        if (node.type === 'folder') {
            return { ...node, children: moveNode(node.children, id, direction) };
        }
        return node;
    });
}

export function toggleFolder(nodes: RequestTreeNode[], id: string): RequestTreeNode[] {
    return nodes.map(node => {
        if (node.id === id && node.type === 'folder') {
            return { ...node, expanded: !node.expanded };
        }
        if (node.type === 'folder') {
            return { ...node, children: toggleFolder(node.children, id) };
        }
        return node;
    });
}
