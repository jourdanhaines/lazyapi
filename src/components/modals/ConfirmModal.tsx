import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Modal } from "./Modal";
import { useStore } from "../../state/store";

interface Props {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({ title, message, onConfirm, onCancel }: Props) {
    const theme = useStore(s => s.theme);

    const [selected, setSelected] = useState<'yes' | 'no'>('no');

    useInput((input, key) => {
        if (key.escape || input === 'n') {
            onCancel();
        } else if (key.return) {
            if (selected === 'yes') onConfirm();
            else onCancel();
        } else if (input === 'y') {
            onConfirm();
        } else if (input === 'h' || key.leftArrow) {
            setSelected('yes');
        } else if (input === 'l' || key.rightArrow) {
            setSelected('no');
        }
    });

    return (
        <Modal title={title}>
            <Box marginBottom={1}>
                <Text color={theme.colors.modalText}>{message}</Text>
            </Box>

            <Box gap={2} justifyContent="center">
                <Text
                    color={selected === 'yes' ? theme.colors.modalTitleText : theme.colors.modalHintText}
                    bold={selected === 'yes'}
                >
                    [Yes]
                </Text>
                <Text
                    color={selected === 'no' ? theme.colors.modalTitleText : theme.colors.modalHintText}
                    bold={selected === 'no'}
                >
                    [No]
                </Text>
            </Box>

            <Box marginTop={1}>
                <Text color={theme.colors.modalHintText}>y/n or ←/→ then Enter</Text>
            </Box>
        </Modal>
    );
}
