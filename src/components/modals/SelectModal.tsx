import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { Modal } from "./Modal";
import { useStore } from "../../state/store";

interface Props {
    title: string;
    options: string[];
    defaultValue?: string;
    onSelect: (value: string) => void;
    onCancel: () => void;
    onHighlight?: (value: string) => void;
    renderItem?: (option: string, isSelected: boolean) => React.ReactNode;
}

export function SelectModal({ title, options, defaultValue, onSelect, onCancel, onHighlight, renderItem }: Props) {
    const theme = useStore(s => s.theme);

    const [selectedIndex, setSelectedIndex] = useState(
        defaultValue ? Math.max(0, options.indexOf(defaultValue)) : 0
    );

    useEffect(() => {
        onHighlight?.(options[selectedIndex]);
    }, [selectedIndex]);

    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        } else if (key.return) {
            onSelect(options[selectedIndex]);
        } else if (input === 'j' || key.downArrow) {
            setSelectedIndex(prev => Math.min(options.length - 1, prev + 1));
        } else if (input === 'k' || key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        }
    });

    return (
        <Modal title={title}>
            <Box flexDirection="column">
                {options.map((option, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <Box
                            key={option}
                            backgroundColor={isSelected ? theme.colors.selectedItemBg : undefined}
                        >
                            {renderItem ? renderItem(option, isSelected) : (
                                <Text color={isSelected ? theme.colors.selectedItem : theme.colors.modalText}>
                                    {` ${option} `}
                                </Text>
                            )}
                        </Box>
                    );
                })}
            </Box>

            <Box marginTop={1}>
                <Text color={theme.colors.modalHintText}>j/k: navigate  Enter: select  Esc: cancel</Text>
            </Box>
        </Modal>
    );
}
