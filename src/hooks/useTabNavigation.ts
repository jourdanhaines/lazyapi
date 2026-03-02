import { useCallback } from "react";
import { useStore } from "../state/store";

export function useTabNavigation<T extends string>(tabs: readonly T[], currentTab: T, setTab: (tab: T) => void) {
    const nextTab = useCallback(() => {
        const idx = tabs.indexOf(currentTab);
        const next = tabs[(idx + 1) % tabs.length];
        setTab(next);
    }, [tabs, currentTab, setTab]);

    const prevTab = useCallback(() => {
        const idx = tabs.indexOf(currentTab);
        const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
        setTab(prev);
    }, [tabs, currentTab, setTab]);

    return { nextTab, prevTab };
}
