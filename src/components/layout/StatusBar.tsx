import React, { useEffect } from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import { keybindingManager } from "../../keybindings/KeybindingManager";

export function StatusBar() {
    const focusedPanel = useStore(s => s.focusedPanel);
    const statusMessage = useStore(s => s.statusMessage);
    const setStatusMessage = useStore(s => s.setStatusMessage);

    useEffect(() => {
        if (!statusMessage) return;

        const timer = setTimeout(() => setStatusMessage(null), 2000);
        return () => clearTimeout(timer);
    }, [statusMessage, setStatusMessage]);

    const hints = keybindingManager.getHintsForPanel(focusedPanel);

    return (
        <Box height={1} paddingX={1}>
            {statusMessage && <Text color="green">{statusMessage}</Text>}

            {!statusMessage && <Text color="gray">{hints}</Text>}
        </Box>
    );
}
