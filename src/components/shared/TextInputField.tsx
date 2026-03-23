// Custom text input replacing @inkjs/ui's TextInput.
// @inkjs/ui's TextInput doesn't support Ctrl+W (delete word) and doesn't
// export its internal hooks (useTextInputState/useTextInput), so we can't
// extend it. This reimplements the same reducer-based approach with added
// support for Ctrl+W and a guard against inserting characters on other
// unhandled ctrl sequences.

import React, { useReducer, useCallback, useEffect, useMemo } from "react";
import { Text, useInput } from "ink";
import chalk from "chalk";
import { useStore } from "../../state/store";
import { tokenizeVariables, classifyVariables, renderVariableTokensWithCursor } from "../../utils/variableHighlight";

interface State {
    previousValue: string;
    value: string;
    cursorOffset: number;
}

type Action =
    | { type: 'move-cursor-left' }
    | { type: 'move-cursor-right' }
    | { type: 'insert'; text: string }
    | { type: 'delete' }
    | { type: 'delete-word' };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'move-cursor-left':
            return { ...state, cursorOffset: Math.max(0, state.cursorOffset - 1) };
        case 'move-cursor-right':
            return { ...state, cursorOffset: Math.min(state.value.length, state.cursorOffset + 1) };
        case 'insert': {
            return {
                ...state,
                previousValue: state.value,
                value: state.value.slice(0, state.cursorOffset) + action.text + state.value.slice(state.cursorOffset),
                cursorOffset: state.cursorOffset + action.text.length,
            };
        }
        case 'delete': {
            const newOffset = Math.max(0, state.cursorOffset - 1);
            return {
                ...state,
                previousValue: state.value,
                value: state.value.slice(0, newOffset) + state.value.slice(newOffset + 1),
                cursorOffset: newOffset,
            };
        }
        case 'delete-word': {
            const before = state.value.slice(0, state.cursorOffset);
            const after = state.value.slice(state.cursorOffset);
            // Delete trailing spaces, then the word
            const trimmed = before.replace(/\s+$/, '');
            const withoutWord = trimmed.replace(/\S+$/, '');
            return {
                ...state,
                previousValue: state.value,
                value: withoutWord + after,
                cursorOffset: withoutWord.length,
            };
        }
    }
}

interface Props {
    defaultValue?: string;
    placeholder?: string;
    isDisabled?: boolean;
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
    variableContext?: Record<string, string> | null;
    onCursorChange?: (offset: number, value: string) => void;
    keyInterceptor?: (input: string, key: any) => boolean;
}

export function TextInputField({ defaultValue = '', placeholder = '', isDisabled = false, onChange, onSubmit, variableContext, onCursorChange, keyInterceptor }: Props) {
    const [state, dispatch] = useReducer(reducer, {
        previousValue: defaultValue,
        value: defaultValue,
        cursorOffset: defaultValue.length,
    });

    const cursor = useMemo(() => chalk.inverse(' '), []);

    const renderedPlaceholder = useMemo(() => {
        if (isDisabled) {
            return placeholder ? chalk.dim(placeholder) : '';
        }
        return placeholder.length > 0
            ? chalk.inverse(placeholder[0]) + chalk.dim(placeholder.slice(1))
            : cursor;
    }, [isDisabled, placeholder, cursor]);

    const theme = useStore(s => s.theme);

    const renderedValue = useMemo(() => {
        if (isDisabled) return state.value;

        if (variableContext && /\{\{/.test(state.value)) {
            const tokens = tokenizeVariables(state.value);
            const classified = classifyVariables(tokens, variableContext);
            return renderVariableTokensWithCursor(
                classified,
                state.cursorOffset,
                theme.colors.variableValid,
                theme.colors.variableInvalid
            );
        }

        let index = 0;
        let result = state.value.length > 0 ? '' : cursor;
        for (const char of state.value) {
            result += index === state.cursorOffset ? chalk.inverse(char) : char;
            index++;
        }
        if (state.value.length > 0 && state.cursorOffset === state.value.length) {
            result += cursor;
        }
        return result;
    }, [isDisabled, state.value, state.cursorOffset, cursor, variableContext, theme]);

    useEffect(() => {
        if (state.value !== state.previousValue) {
            onChange?.(state.value);
        }
    }, [state.previousValue, state.value, onChange]);

    useEffect(() => {
        onCursorChange?.(state.cursorOffset, state.value);
    }, [state.cursorOffset, state.value, onCursorChange]);

    const submit = useCallback(() => {
        onSubmit?.(state.value);
    }, [state.value, onSubmit]);

    useInput((input, key) => {
        if (keyInterceptor?.(input, key)) return;
        if (key.upArrow || key.downArrow || (key.ctrl && input === 'c') || key.tab || (key.shift && key.tab)) {
            return;
        }
        if (key.return) {
            submit();
            return;
        }
        if (key.leftArrow) {
            dispatch({ type: 'move-cursor-left' });
            return;
        }
        if (key.rightArrow) {
            dispatch({ type: 'move-cursor-right' });
            return;
        }
        if (key.ctrl && input === 'w') {
            dispatch({ type: 'delete-word' });
            return;
        }
        if (key.backspace || key.delete) {
            dispatch({ type: 'delete' });
            return;
        }
        if (key.ctrl) return;
        dispatch({ type: 'insert', text: input });
    }, { isActive: !isDisabled });

    const displayValue = state.value.length > 0 ? renderedValue : renderedPlaceholder;

    return <Text>{displayValue}</Text>;
}
