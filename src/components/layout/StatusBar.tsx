import React, { useEffect } from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import { keybindingManager } from "../../keybindings/KeybindingManager";

export function StatusBar() {
    const focusedPanel = useStore(s => s.focusedPanel);
    const statusMessage = useStore(s => s.statusMessage);
    const setStatusMessage = useStore(s => s.setStatusMessage);
    const activeEnv = useStore(s => s.getActiveEnvironment());
    const dotEnvLoaded = useStore(s => s.dotEnvLoaded);
    const dotEnvCount = useStore(s => Object.keys(s.dotEnvVars).length);
    const theme = useStore(s => s.theme);

    useEffect(() => {
        if (!statusMessage) return;

        const timer = setTimeout(() => setStatusMessage(null), 2000);
        return () => clearTimeout(timer);
    }, [statusMessage, setStatusMessage]);

    const hints = keybindingManager.getHintsForPanel(focusedPanel);
    const envBadge = activeEnv ? `[${activeEnv.name}]` : '[no env]';

    return (
        <Box height={1} paddingX={1}>
            <Box marginRight={1}>
                <Text color={activeEnv ? theme.colors.focusedBorder : 'gray'}>{envBadge}</Text>
            </Box>

            {dotEnvLoaded && (
                <Box marginRight={1}>
                    <Text color="gray">[.env: {dotEnvCount}]</Text>
                </Box>
            )}

            {statusMessage && <Text color="green">{statusMessage}</Text>}

            {!statusMessage && <Text color="gray">{hints}</Text>}
        </Box>
    );
}
