import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import type { FuzzyMatch } from "../../utils/fuzzyMatch";

interface Props {
    matches: FuzzyMatch[];
    selectedIndex: number;
    maxVisible?: number;
    row?: number;
    col?: number;
}

export function AutocompleteDropdown({ matches, selectedIndex, maxVisible = 5, row = 0, col = 0 }: Props) {
    const theme = useStore(s => s.theme);

    if (matches.length === 0) return null;

    const start = Math.max(0, Math.min(selectedIndex - Math.floor(maxVisible / 2), matches.length - maxVisible));
    const end = Math.min(start + maxVisible, matches.length);
    const visible = matches.slice(start, end);

    const maxNameLen = Math.max(...visible.map(m => m.name.length));
    const dropdownWidth = maxNameLen + 4;

    return (
        <Box
            position="absolute"
            marginTop={row}
            marginLeft={col}
            flexDirection="column"
        >
            {start > 0 && (
                <Box backgroundColor={theme.colors.modalBackground} width={dropdownWidth}>
                    <Text color="gray"> ↑ {start} more</Text>
                </Box>
            )}

            {visible.map((match, index) => {
                const actualIndex = start + index;
                const isSelected = actualIndex === selectedIndex;
                const matchSet = new Set(match.matchedIndices);
                const bg = isSelected ? theme.colors.selectedItemBg : theme.colors.modalBackground;

                return (
                    <Box
                        key={match.name}
                        backgroundColor={bg}
                        width={dropdownWidth}
                    >
                        <Text backgroundColor={bg}> </Text>
                        {[...match.name].map((char, charIndex) => (
                            <Text
                                key={charIndex}
                                backgroundColor={bg}
                                color={matchSet.has(charIndex) ? theme.colors.focusedBorder : (isSelected ? theme.colors.selectedItem : theme.colors.modalText)}
                                bold={matchSet.has(charIndex)}
                            >
                                {char}
                            </Text>
                        ))}
                        <Text backgroundColor={bg}>{' '.repeat(Math.max(0, maxNameLen - match.name.length + 2))}</Text>
                    </Box>
                );
            })}

            {end < matches.length && (
                <Box backgroundColor={theme.colors.modalBackground} width={dropdownWidth}>
                    <Text color="gray"> ↓ {matches.length - end} more</Text>
                </Box>
            )}
        </Box>
    );
}
