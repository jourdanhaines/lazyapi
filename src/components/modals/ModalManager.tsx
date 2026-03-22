import React from "react";
import { useStore } from "../../state/store";
import { InputModal } from "./InputModal";
import { ConfirmModal } from "./ConfirmModal";
import { SelectModal } from "./SelectModal";
import { HelpModal } from "./HelpModal";
import { SettingsModal } from "./SettingsModal";
import { EnvironmentModal } from "./EnvironmentModal";

export function ModalManager() {
    const modal = useStore(s => s.modal);
    const closeModal = useStore(s => s.closeModal);

    if (!modal) return null;

    function handleConfirm(value: string) {
        modal!.onConfirm(value);
        // Only close if onConfirm didn't open a new modal
        if (useStore.getState().modal === modal) {
            closeModal();
        }
    }

    function handleCancel() {
        modal!.onCancel();
        closeModal();
    }

    switch (modal.type) {
        case 'input':
            return (
                <InputModal
                    key={`${modal.title}-${modal.message}`}
                    title={modal.title}
                    message={modal.message}
                    defaultValue={modal.defaultValue}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            );
        case 'confirm':
            return (
                <ConfirmModal
                    title={modal.title}
                    message={modal.message ?? 'Are you sure?'}
                    onConfirm={() => handleConfirm('yes')}
                    onCancel={handleCancel}
                />
            );
        case 'select':
            return (
                <SelectModal
                    title={modal.title}
                    options={modal.options ?? []}
                    defaultValue={modal.defaultValue}
                    onSelect={handleConfirm}
                    onCancel={handleCancel}
                    onHighlight={modal.onHighlight}
                    renderItem={modal.renderItem}
                />
            );
        case 'help':
            return (
                <HelpModal
                    onClose={handleCancel}
                />
            );
        case 'settings':
            return (
                <SettingsModal
                    onClose={handleCancel}
                />
            );
        case 'environment':
            return (
                <EnvironmentModal
                    onClose={handleCancel}
                />
            );
        default:
            return null;
    }
}
