import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";

interface Props<T> {
    items: T[];
    selectedIndex: number;
    scrollOffset: number;
    visibleCount: number;
    isFocused?: boolean;
    renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
}

export function ScrollableList<T>({ items, selectedIndex, scrollOffset, visibleCount, isFocused = true, renderItem }: Props<T>) {
    const theme = useStore(s => s.theme);

    const end = Math.min(scrollOffset + visibleCount, items.length);
    const visibleItems = items.slice(scrollOffset, end);

    if (items.length === 0) {
        return (
            <Box>
                <Text color="gray" italic>No items</Text>
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
                        key={actualIndex}
                        backgroundColor={isSelected && isFocused ? theme.colors.selectedItemBg : undefined}
                    >
                        {renderItem(item, actualIndex, isSelected)}
                    </Box>
                );
            })}

            {end < items.length && <Text color="gray">  ↓ {items.length - end} more</Text>}
        </Box>
    );
}
