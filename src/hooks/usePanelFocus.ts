import { useMemo } from "react";
import { useStore } from "../state/store";
import type { PanelId } from "../types/ui";

export interface PanelFocusState {
    isFocused: boolean;
    borderColor: string;
}

export function usePanelFocus(panelId: PanelId): PanelFocusState {
    const focusedPanel = useStore(s => s.focusedPanel);
    const theme = useStore(s => s.theme);
    return useMemo(() => ({
        isFocused: focusedPanel === panelId,
        borderColor: focusedPanel === panelId
            ? theme.colors.focusedBorder
            : theme.colors.unfocusedBorder,
    }), [focusedPanel, panelId, theme]);
}
