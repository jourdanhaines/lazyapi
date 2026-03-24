import React, { useRef, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { TextInputField } from "../shared/TextInputField";
import { VariableTextInput } from "../shared/VariableTextInput";
import { Modal } from "./Modal";
import { useStore } from "../../state/store";
import { useTerminalSize } from "../../hooks/useTerminalSize";

interface Props {
    title: string;
    message?: string;
    defaultValue?: string;
    variableContext?: Record<string, string>;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export function InputModal({ title, message, defaultValue = '', variableContext, onConfirm, onCancel }: Props) {
    const valueRef = useRef(defaultValue);
    const theme = useStore(s => s.theme);
    const { columns, rows } = useTerminalSize();

    useInput((_input, key) => {
        if (key.escape) {
            onCancel();
        }
    });

    const dropdownPosition = useMemo(() => {
        const modalWidth = Math.min(60, columns - 10);
        const modalTop = Math.floor(rows / 4);
        const modalLeft = Math.floor((columns - modalWidth) / 2);
        const inputRow = modalTop + (message ? 3 : 2);
        const inputCol = modalLeft + 4;
        return { row: inputRow, col: inputCol };
    }, [columns, rows, message]);

    return (
        <Modal title={title}>
            {message && (
                <Box marginBottom={1}>
                    <Text color={theme.colors.modalText}>{message}</Text>
                </Box>
            )}

            <Box flexDirection="column">
                <Box>
                    <Text color={theme.colors.modalTitleText}>{'> '}</Text>
                    {variableContext ? (
                        <VariableTextInput
                            defaultValue={defaultValue}
                            variableContext={variableContext}
                            dropdownRow={dropdownPosition.row}
                            dropdownCol={dropdownPosition.col}
                            onChange={(val) => (valueRef.current = val)}
                            onSubmit={() => onConfirm(valueRef.current)}
                        />
                    ) : (
                        <TextInputField
                            defaultValue={defaultValue}
                            onChange={(val) => (valueRef.current = val)}
                            onSubmit={() => onConfirm(valueRef.current)}
                        />
                    )}
                </Box>
            </Box>

            <Box marginTop={1}>
                <Text color={theme.colors.modalHintText}>Enter: confirm  Esc: cancel</Text>
            </Box>
        </Modal>
    );
}
