import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import type { FuzzyMatch } from "../../utils/fuzzyMatch";

interface Props {
    matches: FuzzyMatch[];
    selectedIndex: number;
    maxVisible?: number;
}

export function AutocompleteDropdown({ matches, selectedIndex, maxVisible = 5 }: Props) {
    const theme = useStore(s => s.theme);

    if (matches.length === 0) return null;

    const start = Math.max(0, Math.min(selectedIndex - Math.floor(maxVisible / 2), matches.length - maxVisible));
    const end = Math.min(start + maxVisible, matches.length);
    const visible = matches.slice(start, end);

    return (
        <Box flexDirection="column" marginTop={0}>
            {start > 0 && <Text color="gray">  ↑ {start} more</Text>}

            {visible.map((match, index) => {
                const actualIndex = start + index;
                const isSelected = actualIndex === selectedIndex;
                const matchSet = new Set(match.matchedIndices);

                return (
                    <Box
                        key={match.name}
                        backgroundColor={isSelected ? theme.colors.selectedItemBg : undefined}
                    >
                        <Text color="gray">  </Text>
                        {[...match.name].map((char, charIndex) => (
                            <Text
                                key={charIndex}
                                color={matchSet.has(charIndex) ? theme.colors.focusedBorder : (isSelected ? theme.colors.selectedItem : 'gray')}
                                bold={matchSet.has(charIndex)}
                            >
                                {char}
                            </Text>
                        ))}
                    </Box>
                );
            })}

            {end < matches.length && <Text color="gray">  ↓ {matches.length - end} more</Text>}
        </Box>
    );
}
