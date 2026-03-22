import type React from "react";

export type PanelId = 'projects' | 'requests' | 'editor' | 'response';

export const PANEL_ORDER: PanelId[] = ['projects', 'requests', 'editor', 'response'];

export type EditorTab = 'url' | 'params' | 'headers' | 'body';
export type ResponseTab = 'body' | 'headers' | 'timing' | 'history';

export type ModalType = 'input' | 'confirm' | 'select' | 'help' | 'settings' | 'environment';

export interface ModalState {
    type: ModalType;
    title: string;
    message?: string;
    defaultValue?: string;
    options?: string[];
    onConfirm: (value: string) => void;
    onCancel: () => void;
    onHighlight?: (value: string) => void;
    renderItem?: (option: string, isSelected: boolean) => React.ReactNode;
}
