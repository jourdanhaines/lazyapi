import React, { useRef } from "react";
import { Box, Text, useInput } from "ink";
import { TextInputField } from "../shared/TextInputField";
import { Modal } from "./Modal";
import { useStore } from "../../state/store";

interface Props {
    title: string;
    message?: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export function InputModal({ title, message, defaultValue = '', onConfirm, onCancel }: Props) {
    const valueRef = useRef(defaultValue);
    const theme = useStore(s => s.theme);

    useInput((_input, key) => {
        if (key.escape) {
            onCancel();
        }
    });

    return (
        <Modal title={title}>
            {message && (
                <Box marginBottom={1}>
                    <Text color={theme.colors.modalText}>{message}</Text>
                </Box>
            )}

            <Box>
                <Text color={theme.colors.modalTitleText}>{'> '}</Text>
                <TextInputField
                    defaultValue={defaultValue}
                    onChange={(val) => (valueRef.current = val)}
                    onSubmit={() => onConfirm(valueRef.current)}
                />
            </Box>

            <Box marginTop={1}>
                <Text color={theme.colors.modalHintText}>Enter: confirm  Esc: cancel</Text>
            </Box>
        </Modal>
    );
}
