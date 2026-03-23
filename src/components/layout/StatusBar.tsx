import React, { useEffect } from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import { keybindingManager } from "../../keybindings/KeybindingManager";

export function StatusBar() {
    const focusedPanel = useStore(s => s.focusedPanel);
    const statusMessage = useStore(s => s.statusMessage);
    const setStatusMessage = useStore(s => s.setStatusMessage);
    const dotEnvLoaded = useStore(s => s.dotEnvLoaded);
    const dotEnvCount = useStore(s => Object.keys(s.dotEnvVars).length);

    useEffect(() => {
        if (!statusMessage) return;

        const timer = setTimeout(() => setStatusMessage(null), 2000);
        return () => clearTimeout(timer);
    }, [statusMessage, setStatusMessage]);

    const hints = keybindingManager.getHintsForPanel(focusedPanel);
    const content = statusMessage ?? hints;

    return (
        <Box height={1} paddingX={1}>
            <Text wrap="truncate-end">
                {dotEnvLoaded && <Text color="gray">[.env: {dotEnvCount}] </Text>}
                <Text color={statusMessage ? 'green' : 'gray'}>{content}</Text>
            </Text>
        </Box>
    );
}
