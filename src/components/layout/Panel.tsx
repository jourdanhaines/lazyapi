import React from "react";
import { Box, Text } from "ink";
import { usePanelFocus } from "../../hooks/usePanelFocus";
import { PANEL_ORDER, type PanelId } from "../../types/ui";

interface Props {
    id: PanelId;
    title: string;
    children: React.ReactNode;
    height?: number | string;
    width?: number | string;
}

export function Panel({ id, title, children, height, width }: Props) {
    const { isFocused, borderColor } = usePanelFocus(id);

    const panelNumber = PANEL_ORDER.indexOf(id) + 1;

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={borderColor}
            height={height as number}
            width={width as number}
            paddingX={1}
        >
            {/* Title overlaid on top border */}
            <Box position="absolute" marginTop={-1} marginLeft={0}>
                <Text color={borderColor} bold={isFocused}>
                    [{panelNumber}]─{title}─
                </Text>
            </Box>

            <Box flexDirection="column" flexGrow={1}>
                {children}
            </Box>
        </Box>
    );
}
