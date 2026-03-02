import React, { useRef, useState, useEffect } from "react";
import { Box, Text, measureElement } from "ink";
import { useTerminalSize } from "../../hooks/useTerminalSize";
import { useStore } from "../../state/store";

interface Props {
        title: string;
        width?: number;
        children: React.ReactNode;
}

export function Modal({ title, children, width: customWidth }: Props) {
        const theme = useStore(s => s.theme);
        const contentRef = useRef<any>(null);

        const { columns, rows } = useTerminalSize();

        const [contentHeight, setContentHeight] = useState(0);

        const width = customWidth ?? Math.min(60, columns - 10);
        const modalTop = Math.floor(rows / 4);
        const innerWidth = width - 2;
        const bg = theme.colors.modalBackground;
        const bc = theme.colors.modalBorder;
        const titleStr = `─${title}─`;
        const remaining = Math.max(0, innerWidth - titleStr.length);

        useEffect(() => {
                if (contentRef.current) {
                        const { height } = measureElement(contentRef.current);
                        if (height !== contentHeight) {
                                setContentHeight(height);
                        }
                }
        });

        const sideBorder = contentHeight > 0
                ? Array(contentHeight).fill('│').join('\n')
                : '│';

        return (
                <Box
                        position="absolute"
                        marginLeft={Math.floor((columns - width) / 2)}
                        marginTop={modalTop}
                        width={width}
                        flexDirection="column"
                >
                        {/* Top border with title */}
                        <Box>
                                <Text color={bc} backgroundColor={bg}>╭</Text>
                                <Text bold color={theme.colors.modalTitleText} backgroundColor={bg}>{titleStr}</Text>
                                <Text color={bc} backgroundColor={bg}>{'─'.repeat(remaining)}╮</Text>
                        </Box>

                        {/* Content flanked by thin side borders */}
                        <Box flexDirection="row">
                                <Box width={1}>
                                        <Text color={bc} backgroundColor={bg}>{sideBorder}</Text>
                                </Box>
                                <Box ref={contentRef} flexDirection="column" flexGrow={1} paddingX={1} backgroundColor={bg}>
                                        {children}
                                </Box>
                                <Box width={1}>
                                        <Text color={bc} backgroundColor={bg}>{sideBorder}</Text>
                                </Box>
                        </Box>

                        {/* Bottom border */}
                        <Box>
                                <Text color={bc} backgroundColor={bg}>╰{'─'.repeat(innerWidth)}╯</Text>
                        </Box>
                </Box>
        );
}
