import { useState, useCallback, useMemo } from "react";

export interface ScrollableListState {
    selectedIndex: number;
    scrollOffset: number;
    visibleItems: number;
    moveUp: () => void;
    moveDown: () => void;
    setSelected: (index: number) => void;
    getVisibleRange: () => { start: number; end: number };
}

export function useScrollableList(totalItems: number, visibleItems: number): ScrollableListState {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);

    const clampedVisible = Math.min(visibleItems, totalItems);

    const moveUp = useCallback(() => {
        setSelectedIndex(prev => {
            const next = Math.max(0, prev - 1);
            setScrollOffset(prevScroll => {
                if (next < prevScroll) return next;
                return prevScroll;
            });
            return next;
        });
    }, []);

    const moveDown = useCallback(() => {
        setSelectedIndex(prev => {
            const next = Math.min(totalItems - 1, prev + 1);
            setScrollOffset(prevScroll => {
                if (next >= prevScroll + clampedVisible) {
                    return next - clampedVisible + 1;
                }
                return prevScroll;
            });
            return next;
        });
    }, [totalItems, clampedVisible]);

    const setSelected = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(totalItems - 1, index));
        setSelectedIndex(clamped);
        setScrollOffset(prev => {
            if (clamped < prev) return clamped;
            if (clamped >= prev + clampedVisible) return clamped - clampedVisible + 1;
            return prev;
        });
    }, [totalItems, clampedVisible]);

    const getVisibleRange = useCallback(() => ({
        start: scrollOffset,
        end: Math.min(scrollOffset + clampedVisible, totalItems),
    }), [scrollOffset, clampedVisible, totalItems]);

    return useMemo(() => ({
        selectedIndex,
        scrollOffset,
        visibleItems: clampedVisible,
        moveUp,
        moveDown,
        setSelected,
        getVisibleRange,
    }), [selectedIndex, scrollOffset, clampedVisible, moveUp, moveDown, setSelected, getVisibleRange]);
}
