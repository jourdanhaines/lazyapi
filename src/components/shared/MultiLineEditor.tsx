import React, { useReducer, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { tokenizeJsonLine, highlightTokensWithCursor } from "../../utils/syntax";

interface State {
    lines: string[];
    cursorRow: number;
    cursorCol: number;
    desiredCol: number;
    scrollOffset: number;
}

type Action =
    | { type: "move-cursor-left" }
    | { type: "move-cursor-right" }
    | { type: "move-cursor-up"; visibleLines: number }
    | { type: "move-cursor-down"; visibleLines: number }
    | { type: "move-word-left" }
    | { type: "move-word-right" }
    | { type: "move-home" }
    | { type: "move-end" }
    | { type: "insert"; text: string; visibleLines: number }
    | { type: "insert-newline"; visibleLines: number }
    | { type: "insert-tab"; visibleLines: number }
    | { type: "delete"; visibleLines: number }
    | { type: "delete-forward"; visibleLines: number }
    | { type: "delete-word"; visibleLines: number }
    | { type: "insert-pair"; open: string; close: string }
    | { type: "insert-brace"; visibleLines: number }
    | { type: "skip-over" };

function adjustScroll(row: number, scrollOffset: number, visibleLines: number): number {
    if (row < scrollOffset) return row;
    if (row >= scrollOffset + visibleLines) return row - visibleLines + 1;
    return scrollOffset;
}

function findWordBoundaryLeft(text: string, col: number): number {
    let position = col;
    // Skip whitespace backwards
    while (position > 0 && /\s/.test(text[position - 1])) position--;
    // Skip word characters backwards
    while (position > 0 && /\S/.test(text[position - 1])) position--;
    return position;
}

function findWordBoundaryRight(text: string, col: number): number {
    let position = col;
    // Skip word characters forwards
    while (position < text.length && /\S/.test(text[position])) position++;
    // Skip whitespace forwards
    while (position < text.length && /\s/.test(text[position])) position++;
    return position;
}

function reducer(state: State, action: Action): State {
    const { lines, cursorRow, cursorCol } = state;
    const line = lines[cursorRow] ?? "";

    switch (action.type) {
        case "move-cursor-left": {
            if (cursorCol > 0) {
                const newCol = cursorCol - 1;
                return { ...state, cursorCol: newCol, desiredCol: newCol };
            }
            if (cursorRow > 0) {
                const newCol = lines[cursorRow - 1].length;
                return { ...state, cursorRow: cursorRow - 1, cursorCol: newCol, desiredCol: newCol };
            }
            return state;
        }
        case "move-cursor-right": {
            if (cursorCol < line.length) {
                const newCol = cursorCol + 1;
                return { ...state, cursorCol: newCol, desiredCol: newCol };
            }
            if (cursorRow < lines.length - 1) {
                return { ...state, cursorRow: cursorRow + 1, cursorCol: 0, desiredCol: 0 };
            }
            return state;
        }
        case "move-cursor-up": {
            if (cursorRow === 0) return state;
            const newRow = cursorRow - 1;
            const newCol = Math.min(state.desiredCol, lines[newRow].length);
            const newScroll = adjustScroll(newRow, state.scrollOffset, action.visibleLines);
            return { ...state, cursorRow: newRow, cursorCol: newCol, scrollOffset: newScroll };
        }
        case "move-cursor-down": {
            if (cursorRow >= lines.length - 1) return state;
            const newRow = cursorRow + 1;
            const newCol = Math.min(state.desiredCol, lines[newRow].length);
            const newScroll = adjustScroll(newRow, state.scrollOffset, action.visibleLines);
            return { ...state, cursorRow: newRow, cursorCol: newCol, scrollOffset: newScroll };
        }
        case "move-word-left": {
            const newCol = findWordBoundaryLeft(line, cursorCol);
            return { ...state, cursorCol: newCol, desiredCol: newCol };
        }
        case "move-word-right": {
            const newCol = findWordBoundaryRight(line, cursorCol);
            return { ...state, cursorCol: newCol, desiredCol: newCol };
        }
        case "move-home": {
            return { ...state, cursorCol: 0, desiredCol: 0 };
        }
        case "move-end": {
            const newCol = line.length;
            return { ...state, cursorCol: newCol, desiredCol: newCol };
        }
        case "insert": {
            const newLine = line.slice(0, cursorCol) + action.text + line.slice(cursorCol);
            const newLines = [...lines];
            newLines[cursorRow] = newLine;
            const newCol = cursorCol + action.text.length;
            return {
                ...state,
                lines: newLines,
                cursorCol: newCol,
                desiredCol: newCol,
            };
        }
        case "insert-newline": {
            const before = line.slice(0, cursorCol);
            const after = line.slice(cursorCol);
            const indent = line.match(/^(\s*)/)?.[1] ?? "";
            const newLines = [...lines];
            newLines.splice(cursorRow, 1, before, indent + after);
            const newRow = cursorRow + 1;
            const newCol = indent.length;
            const newScroll = adjustScroll(newRow, state.scrollOffset, action.visibleLines);
            return {
                ...state,
                lines: newLines,
                cursorRow: newRow,
                cursorCol: newCol,
                desiredCol: newCol,
                scrollOffset: newScroll,
            };
        }
        case "insert-tab": {
            const tab = "    ";
            const newLine = line.slice(0, cursorCol) + tab + line.slice(cursorCol);
            const newLines = [...lines];
            newLines[cursorRow] = newLine;
            const newCol = cursorCol + tab.length;
            return {
                ...state,
                lines: newLines,
                cursorCol: newCol,
                desiredCol: newCol,
            };
        }
        case "delete": {
            if (cursorCol > 0) {
                const newLine = line.slice(0, cursorCol - 1) + line.slice(cursorCol);
                const newLines = [...lines];
                newLines[cursorRow] = newLine;
                const newCol = cursorCol - 1;
                return {
                    ...state,
                    lines: newLines,
                    cursorCol: newCol,
                    desiredCol: newCol,
                };
            }
            if (cursorRow > 0) {
                const prevLine = lines[cursorRow - 1];
                const merged = prevLine + line;
                const newLines = [...lines];
                newLines.splice(cursorRow - 1, 2, merged);
                const newRow = cursorRow - 1;
                const newCol = prevLine.length;
                const newScroll = adjustScroll(newRow, state.scrollOffset, action.visibleLines);
                return {
                    ...state,
                    lines: newLines,
                    cursorRow: newRow,
                    cursorCol: newCol,
                    desiredCol: newCol,
                    scrollOffset: newScroll,
                };
            }
            return state;
        }
        case "delete-forward": {
            if (cursorCol < line.length) {
                const newLine = line.slice(0, cursorCol) + line.slice(cursorCol + 1);
                const newLines = [...lines];
                newLines[cursorRow] = newLine;
                return {
                    ...state,
                    lines: newLines,
                };
            }
            if (cursorRow < lines.length - 1) {
                const nextLine = lines[cursorRow + 1];
                const merged = line + nextLine;
                const newLines = [...lines];
                newLines.splice(cursorRow, 2, merged);
                return {
                    ...state,
                    lines: newLines,
                };
            }
            return state;
        }
        case "delete-word": {
            const before = line.slice(0, cursorCol);
            const after = line.slice(cursorCol);
            const trimmed = before.replace(/\s+$/, "");
            const withoutWord = trimmed.replace(/\S+$/, "");
            const newLine = withoutWord + after;
            const newLines = [...lines];
            newLines[cursorRow] = newLine;
            const newCol = withoutWord.length;
            return {
                ...state,
                lines: newLines,
                cursorCol: newCol,
                desiredCol: newCol,
            };
        }
        case "insert-pair": {
            const newLine = line.slice(0, cursorCol) + action.open + action.close + line.slice(cursorCol);
            const newLines = [...lines];
            newLines[cursorRow] = newLine;
            const newCol = cursorCol + 1;
            return {
                ...state,
                lines: newLines,
                cursorCol: newCol,
                desiredCol: newCol,
            };
        }
        case "insert-brace": {
            const before = line.slice(0, cursorCol);
            const after = line.slice(cursorCol);
            const indent = line.match(/^(\s*)/)?.[1] ?? "";
            const deeperIndent = indent + "    ";
            const newLines = [...lines];
            newLines.splice(cursorRow, 1, before + "{", deeperIndent, indent + "}" + after);
            const newRow = cursorRow + 1;
            const newCol = deeperIndent.length;
            const newScroll = adjustScroll(newRow, state.scrollOffset, action.visibleLines);
            return {
                ...state,
                lines: newLines,
                cursorRow: newRow,
                cursorCol: newCol,
                desiredCol: newCol,
                scrollOffset: newScroll,
            };
        }
        case "skip-over": {
            const newCol = cursorCol + 1;
            return { ...state, cursorCol: newCol, desiredCol: newCol };
        }
    }
}

type SyntaxMode = "json" | "none";

interface Props {
    defaultValue: string;
    visibleLines: number;
    isActive: boolean;
    syntax?: SyntaxMode;
    onSave: (value: string) => void;
    onCancel: () => void;
}

export function MultiLineEditor({ defaultValue, visibleLines, isActive, syntax = "none", onSave, onCancel }: Props) {
    const initialLines = defaultValue.split("\n");

    const [state, dispatch] = useReducer(reducer, {
        lines: initialLines,
        cursorRow: 0,
        cursorCol: 0,
        desiredCol: 0,
        scrollOffset: 0,
    });

    useInput((input, key) => {
        if (key.ctrl && input === "s") {
            onSave(state.lines.join("\n"));
            return;
        }
        if (key.escape) {
            onCancel();
            return;
        }
        if (key.return) {
            dispatch({ type: "insert-newline", visibleLines });
            return;
        }
        if (key.tab) {
            dispatch({ type: "insert-tab", visibleLines });
            return;
        }
        if (key.upArrow) {
            dispatch({ type: "move-cursor-up", visibleLines });
            return;
        }
        if (key.downArrow) {
            dispatch({ type: "move-cursor-down", visibleLines });
            return;
        }
        if (key.leftArrow && key.ctrl) {
            dispatch({ type: "move-word-left" });
            return;
        }
        if (key.rightArrow && key.ctrl) {
            dispatch({ type: "move-word-right" });
            return;
        }
        if (key.leftArrow) {
            dispatch({ type: "move-cursor-left" });
            return;
        }
        if (key.rightArrow) {
            dispatch({ type: "move-cursor-right" });
            return;
        }
        if ((key as any).home) {
            dispatch({ type: "move-home" });
            return;
        }
        if ((key as any).end) {
            dispatch({ type: "move-end" });
            return;
        }
        if (key.ctrl && input === "w") {
            dispatch({ type: "delete-word", visibleLines });
            return;
        }
        if (key.ctrl && input === "a") {
            dispatch({ type: "move-home" });
            return;
        }
        if (key.ctrl && input === "e") {
            dispatch({ type: "move-end" });
            return;
        }
        if (key.backspace) {
            dispatch({ type: "delete", visibleLines });
            return;
        }
        if (key.delete) {
            dispatch({ type: "delete-forward", visibleLines });
            return;
        }
        if (key.ctrl) return;

        // Auto-pair and skip-over logic
        const currentLine = state.lines[state.cursorRow] ?? "";
        const charAfterCursor = currentLine[state.cursorCol];

        // Skip over closing character if it matches what's ahead
        if ((input === "'" || input === '"' || input === ")" || input === "]" || input === "}") && charAfterCursor === input) {
            dispatch({ type: "skip-over" });
            return;
        }

        // Curly brace: expand with newline and indent
        if (input === "{") {
            dispatch({ type: "insert-brace", visibleLines });
            return;
        }

        // Auto-pair for quotes and brackets
        const PAIR_CLOSE: Record<string, string> = { "'": "'", '"': '"', "(": ")", "[": "]" };
        const close = PAIR_CLOSE[input];
        if (close) {
            dispatch({ type: "insert-pair", open: input, close });
            return;
        }

        dispatch({ type: "insert", text: input, visibleLines });
    }, { isActive });

    const { lines, cursorRow, cursorCol, scrollOffset } = state;
    const visibleSlice = lines.slice(scrollOffset, scrollOffset + visibleLines);
    const linesAbove = scrollOffset;
    const linesBelow = Math.max(0, lines.length - scrollOffset - visibleLines);

    const isJson = syntax === "json";

    const renderedLines = useMemo(() => {
        return visibleSlice.map((line, index) => {
            const absoluteRow = scrollOffset + index;
            const isCursorRow = absoluteRow === cursorRow;
            const tokens = isJson ? tokenizeJsonLine(line) : [{ text: line }];
            return highlightTokensWithCursor(line, tokens, isCursorRow ? cursorCol : null);
        });
    }, [visibleSlice, scrollOffset, cursorRow, cursorCol, isJson]);

    return (
        <Box flexDirection="column">
            {linesAbove > 0 && (
                <Text color="gray">{"↑ " + linesAbove + " lines"}</Text>
            )}

            {renderedLines.map((rendered, index) => (
                <Text key={scrollOffset + index}>{rendered}</Text>
            ))}

            {linesBelow > 0 && (
                <Text color="gray">{"↓ " + linesBelow + " lines"}</Text>
            )}
        </Box>
    );
}
