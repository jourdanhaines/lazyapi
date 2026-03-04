import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { tokenizeJsonLine, highlightTokens } from "../../utils/syntax";

type Props = {
    content: string;
    syntax: "json" | "none";
    scrollOffset: number;
    visibleLines: number;
    placeholder?: string;
};

export function ContentViewer({ content, syntax, scrollOffset, visibleLines, placeholder }: Props) {
    if (!content) {
        return (
            <Box>
                <Text color="gray" italic>{placeholder || "No content"}</Text>
            </Box>
        );
    }

    const lines = content.split("\n");
    const totalLines = lines.length;

    const hasAbove = scrollOffset > 0;
    const hasBelow = scrollOffset + visibleLines < totalLines;

    const adjustedVisible = visibleLines - (hasAbove ? 1 : 0) - (hasBelow ? 1 : 0);
    const visible = lines.slice(scrollOffset, scrollOffset + adjustedVisible);

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
            {hasAbove && (
                <Text color="gray">↑ {scrollOffset} lines above</Text>
            )}

            {renderedLines.map((line, index) => (
                <Text key={scrollOffset + index}>{line}</Text>
            ))}

            {hasBelow && (
                <Text color="gray">↓ {totalLines - scrollOffset - adjustedVisible} lines below</Text>
            )}
        </Box>
    );
}
