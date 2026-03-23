import React, { useState, useMemo, useCallback, useEffect } from "react";
import { TextInputField } from "./TextInputField";
import { useAutocomplete } from "../../hooks/useAutocomplete";
import { useStore } from "../../state/store";

interface Props {
    defaultValue?: string;
    placeholder?: string;
    isDisabled?: boolean;
    variableContext: Record<string, string>;
    dropdownRow?: number;
    dropdownCol?: number;
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
}

export function VariableTextInput({ variableContext, dropdownRow = 0, dropdownCol = 0, onChange, onSubmit, ...props }: Props) {
    const [cursorOffset, setCursorOffset] = useState(0);
    const [currentValue, setCurrentValue] = useState(props.defaultValue ?? '');
    const [inputKey, setInputKey] = useState(0);
    const [overrideDefault, setOverrideDefault] = useState(props.defaultValue);

    const setAutocomplete = useStore(s => s.setAutocomplete);

    const variableNames = useMemo(
        () => Object.keys(variableContext),
        [variableContext]
    );

    const autocomplete = useAutocomplete(currentValue, cursorOffset, variableNames, true);

    useEffect(() => {
        if (autocomplete.isOpen) {
            setAutocomplete({
                matches: autocomplete.matches,
                selectedIndex: autocomplete.selectedIndex,
                row: dropdownRow,
                col: dropdownCol,
            });
        } else {
            setAutocomplete(null);
        }
    }, [autocomplete.isOpen, autocomplete.matches, autocomplete.selectedIndex, dropdownRow, dropdownCol]);

    useEffect(() => {
        return () => setAutocomplete(null);
    }, []);

    const handleCursorChange = useCallback((offset: number, value: string) => {
        setCursorOffset(offset);
        setCurrentValue(value);
    }, []);

    const handleChange = useCallback((value: string) => {
        setCurrentValue(value);
        onChange?.(value);
    }, [onChange]);

    function acceptCompletion(): string | null {
        const newValue = autocomplete.accept();
        if (!newValue) return null;
        setOverrideDefault(newValue);
        setCurrentValue(newValue);
        setInputKey(prev => prev + 1);
        onChange?.(newValue);
        return newValue;
    }

    const keyInterceptor = useCallback((input: string, key: any): boolean => {
        if (!autocomplete.isOpen) return false;

        if (key.tab) {
            acceptCompletion();
            return true;
        }

        if (key.return) {
            acceptCompletion();
            return true;
        }

        if (key.upArrow) {
            autocomplete.moveUp();
            return true;
        }

        if (key.downArrow) {
            autocomplete.moveDown();
            return true;
        }

        return false;
    }, [autocomplete.isOpen, autocomplete.matches, autocomplete.selectedIndex]);

    return (
        <TextInputField
            key={inputKey}
            defaultValue={overrideDefault}
            placeholder={props.placeholder}
            isDisabled={props.isDisabled}
            variableContext={variableContext}
            onChange={handleChange}
            onSubmit={onSubmit}
            onCursorChange={handleCursorChange}
            keyInterceptor={keyInterceptor}
        />
    );
}
