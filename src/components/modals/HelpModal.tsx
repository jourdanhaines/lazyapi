import React from "react";
import { Box, Text, useInput } from "ink";
import { Modal } from "./Modal";
import { useStore } from "../../state/store";
import { keybindingManager } from "../../keybindings/KeybindingManager";

interface Props {
    onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
    const theme = useStore(s => s.theme);

    const { global, panel } = keybindingManager.getAllBindings();

    useInput((input, key) => {
        if (key.escape || input === '?' || input === 'q') {
            onClose();
        }
    });

    return (
        <Modal title="Keybinding Reference" width={50}>
            <Box flexDirection="column">
                <Text bold color="yellow">Global</Text>

                {global.map(binding => (
                    <Box key={binding.key}>
                        <Text color={theme.colors.modalTitleText}>{binding.label.padEnd(10)}</Text>
                        <Text color={theme.colors.modalText}>{binding.description}</Text>
                    </Box>
                ))}

                <Text> </Text>

                <Text bold color="yellow">Panel</Text>

                {panel.map(binding => (
                    <Box key={binding.key}>
                        <Text color={theme.colors.modalTitleText}>{binding.label.padEnd(10)}</Text>
                        <Text color={theme.colors.modalText}>{binding.description}</Text>
                    </Box>
                ))}
            </Box>

            <Box marginTop={1}>
                <Text color={theme.colors.modalHintText}>Press Esc or ? to close</Text>
            </Box>
        </Modal>
    );
}
