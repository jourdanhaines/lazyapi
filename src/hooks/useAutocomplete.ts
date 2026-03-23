import { useState, useMemo } from "react";
import { detectVariableAtCursor } from "../utils/variableHighlight";
import { fuzzyFilter, type FuzzyMatch } from "../utils/fuzzyMatch";

export interface UseAutocompleteResult {
    isOpen: boolean;
    matches: FuzzyMatch[];
    selectedIndex: number;
    accept: () => string | null;
    moveUp: () => void;
    moveDown: () => void;
}

export function useAutocomplete(
    value: string,
    cursorOffset: number,
    variableNames: string[],
    isActive: boolean
): UseAutocompleteResult {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const cursorInfo = useMemo(
        () => isActive ? detectVariableAtCursor(value, cursorOffset) : null,
        [value, cursorOffset, isActive]
    );

    const matches = useMemo(() => {
        if (!cursorInfo) return [];
        const results = fuzzyFilter(cursorInfo.partialName, variableNames);
        setSelectedIndex(0);
        return results;
    }, [cursorInfo?.partialName, variableNames]);

    const isOpen = cursorInfo !== null && matches.length > 0;

    function accept(): string | null {
        if (!isOpen || !cursorInfo || !matches[selectedIndex]) return null;
        const selected = matches[selectedIndex].name;
        const before = value.slice(0, cursorInfo.startOffset);
        const after = value.slice(cursorInfo.endOffset);
        return `${before}{{${selected}}}${after}`;
    }

    function moveUp() {
        setSelectedIndex(prev => Math.max(0, prev - 1));
    }

    function moveDown() {
        setSelectedIndex(prev => Math.min(matches.length - 1, prev + 1));
    }

    return { isOpen, matches, selectedIndex, accept, moveUp, moveDown };
}
