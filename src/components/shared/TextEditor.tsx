import React from "react";
import { Box, Text } from "ink";

interface Props {
    content: string;
    scrollOffset: number;
    visibleLines: number;
    placeholder?: string;
}

export function TextEditor({ content, scrollOffset, visibleLines, placeholder }: Props) {
    if (!content) {
        return (
            <Box>
                <Text color="gray" italic>{placeholder || 'Press e to edit'}</Text>
            </Box>
        );
    }

    const lines = content.split('\n');
    const visible = lines.slice(scrollOffset, scrollOffset + visibleLines);

    return (
        <Box flexDirection="column">
            {visible.map((line, index) => (
                <Text key={scrollOffset + index}>{line}</Text>
            ))}

            {scrollOffset + visibleLines < lines.length && (
                <Text color="gray">↓ {lines.length - scrollOffset - visibleLines} more lines</Text>
            )}
        </Box>
    );
}
