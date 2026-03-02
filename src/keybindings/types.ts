import type { PanelId } from "../types/ui";

export interface KeyBinding {
    key: string;
    label: string;
    description: string;
    action: string;
}

export interface KeyMap {
    global: KeyBinding[];
    panels: Record<PanelId, KeyBinding[]>;
}
