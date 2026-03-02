import React, { useCallback, useMemo } from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import { usePanelFocus } from "../../hooks/usePanelFocus";
import { TreeView } from "../shared/TreeView";
import { MethodBadge } from "../shared/MethodBadge";
import { flattenVisibleTree, type FlatTreeItem } from "../../utils/tree";

interface Props {
    height: number;
}

export function RequestTree({ height }: Props) {
    const project = useStore(s => s.getActiveProject());
    const selectedRequestId = useStore(s => s.selectedRequestId);

    const { isFocused } = usePanelFocus('requests');

    const flatItems = useMemo(
        () => project ? flattenVisibleTree(project.collection) : [],
        [project]
    );

    const selectedIndex = useMemo(() => {
        if (!selectedRequestId) return 0;
        const idx = flatItems.findIndex(f => f.node.id === selectedRequestId);
        return idx >= 0 ? idx : 0;
    }, [flatItems, selectedRequestId]);

    const scrollOffset = useMemo(() => {
        const visible = Math.max(1, height - 2);
        if (selectedIndex < visible) return 0;
        return selectedIndex - visible + 1;
    }, [selectedIndex, height]);

    const renderItem = useCallback((item: FlatTreeItem, isSelected: boolean) => {
        const node = item.node;
        if (node.type === 'folder') {
            return (
                <Text color={isSelected ? '#FFFFFF' : 'yellow'}>
                    {node.expanded ? '▼ ' : '▶ '}{node.name}/
                </Text>
            );
        }
        return (
            <Box>
                <MethodBadge method={node.method} isCompact />
                <Text color={isSelected ? '#FFFFFF' : undefined}> {node.name}</Text>
            </Box>
        );
    }, []);

    if (!project) {
        return <Text color="gray" italic>No project selected</Text>;
    }

    return (
        <TreeView
            items={flatItems}
            selectedIndex={selectedIndex}
            scrollOffset={scrollOffset}
            visibleCount={Math.max(1, height - 2)}
            isFocused={isFocused}
            renderItem={renderItem}
        />
    );
}
