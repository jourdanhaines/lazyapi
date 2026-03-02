import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import type { FlatTreeItem } from "../../utils/tree";

interface Props {
    items: FlatTreeItem[];
    selectedIndex: number;
    scrollOffset: number;
    visibleCount: number;
    isFocused?: boolean;
    renderItem: (item: FlatTreeItem, isSelected: boolean) => React.ReactNode;
}

export function TreeView({ items, selectedIndex, scrollOffset, visibleCount, isFocused = true, renderItem }: Props) {
    const theme = useStore(s => s.theme);

    const end = Math.min(scrollOffset + visibleCount, items.length);
    const visibleItems = items.slice(scrollOffset, end);

    if (items.length === 0) {
        return (
            <Box>
                <Text color="gray" italic>No requests</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column">
            {scrollOffset > 0 && <Text color="gray">  ↑ {scrollOffset} more</Text>}

            {visibleItems.map((item, index) => {
                const actualIndex = scrollOffset + index;
                const isSelected = actualIndex === selectedIndex;
                return (
                    <Box
                        key={item.node.id}
                        backgroundColor={isSelected && isFocused ? theme.colors.selectedItemBg : undefined}
                    >
                        <Text>{' '.repeat(item.depth * 2)}</Text>
                        {renderItem(item, isSelected)}
                    </Box>
                );
            })}

            {end < items.length && <Text color="gray">  ↓ {items.length - end} more</Text>}
        </Box>
    );
}
