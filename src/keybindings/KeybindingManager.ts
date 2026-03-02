import type { PanelId } from "../types/ui";
import { DEFAULT_KEYMAP } from "./keymaps";
import type { KeyBinding } from "./types";

export class KeybindingManager {
    getHintsForPanel(panel: PanelId): string {
        const globalHints = DEFAULT_KEYMAP.global
            .filter(k => ['tab', 'left', '?', 'q'].includes(k.key))
            .map(k => `${k.label}: ${k.description}`);

        const panelHints = DEFAULT_KEYMAP.panels[panel]
            .map(k => `${k.label}: ${k.description}`);

        return [...panelHints, ...globalHints].join('  ');
    }

    getAllBindings(): { global: KeyBinding[]; panel: KeyBinding[] } {
        const allPanel: KeyBinding[] = [];
        for (const bindings of Object.values(DEFAULT_KEYMAP.panels)) {
            for (const b of bindings) {
                if (!allPanel.find(x => x.key === b.key)) {
                    allPanel.push(b);
                }
            }
        }
        return {
            global: DEFAULT_KEYMAP.global,
            panel: allPanel,
        };
    }
}

export const keybindingManager = new KeybindingManager();
