import React, { useMemo } from "react";
import { Box, Text } from "ink";
import chalk from "chalk";

interface Props {
    content: string;
    scrollOffset: number;
    visibleLines: number;
    maxPrettyPrint?: number;
}

function highlightJson(json: string): string {
    return json
        .replace(/"([^"]+)":/g, chalk.cyan('"$1"') + ':')
        .replace(/: "([^"]*)"/g, ': ' + chalk.green('"$1"'))
        .replace(/: (\d+\.?\d*)/g, ': ' + chalk.yellow('$1'))
        .replace(/: (true|false)/g, ': ' + chalk.magenta('$1'))
        .replace(/: (null)/g, ': ' + chalk.gray('$1'));
}

export function JsonViewer({ content, scrollOffset, visibleLines, maxPrettyPrint = 102400 }: Props) {
    const formatted = useMemo(() => {
        if (!content) return '';
        try {
            if (content.length <= maxPrettyPrint) {
                const parsed = JSON.parse(content);
                const pretty = JSON.stringify(parsed, null, 2);
                return highlightJson(pretty);
            }
            return content;
        } catch {
            return content;
        }
    }, [content, maxPrettyPrint]);

    const lines = formatted.split('\n');
    const visible = lines.slice(scrollOffset, scrollOffset + visibleLines);
    const totalLines = lines.length;

    return (
        <Box flexDirection="column">
            {scrollOffset > 0 && (
                <Text color="gray">↑ {scrollOffset} lines above</Text>
            )}

            {visible.map((line, index) => (
                <Text key={scrollOffset + index}>{line}</Text>
            ))}

            {scrollOffset + visibleLines < totalLines && (
                <Text color="gray">↓ {totalLines - scrollOffset - visibleLines} lines below</Text>
            )}
        </Box>
    );
}
