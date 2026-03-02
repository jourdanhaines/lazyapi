import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { tokenizeJsonLine, highlightTokens } from "../../utils/syntax";

interface Props {
    content: string;
    scrollOffset: number;
    visibleLines: number;
    placeholder?: string;
    syntax?: "json" | "none";
}

export function TextEditor({ content, scrollOffset, visibleLines, placeholder, syntax = "none" }: Props) {
    if (!content) {
        return (
            <Box>
                <Text color="gray" italic>{placeholder || 'Press e to edit'}</Text>
            </Box>
        );
    }

    const lines = content.split('\n');
    const visible = lines.slice(scrollOffset, scrollOffset + visibleLines);

    const isJson = syntax === "json";

    const renderedLines = useMemo(() => {
        if (!isJson) return visible;
        return visible.map(line => {
            const tokens = tokenizeJsonLine(line);
            return highlightTokens(tokens);
        });
    }, [visible, isJson]);

    return (
        <Box flexDirection="column">
            {renderedLines.map((line, index) => (
                <Text key={scrollOffset + index}>{line}</Text>
            ))}

            {scrollOffset + visibleLines < lines.length && (
                <Text color="gray">↓ {lines.length - scrollOffset - visibleLines} more lines</Text>
            )}
        </Box>
    );
}
