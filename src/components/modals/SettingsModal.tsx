import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { Modal } from "./Modal";
import { useStore } from "../../state/store";
import { configManager } from "../../services/ConfigManager";
import { themeManager } from "../../services/ThemeManager";
import { BUILTIN_THEMES } from "../../types/theme";

const SETTINGS_TABS = ['general', 'theme'] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

const TAB_LABELS: Record<SettingsTab, string> = {
    general: 'General',
    theme: 'Theme',
};

interface Props {
    onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
    const theme = useStore(s => s.theme);
    const config = useStore(s => s.config);
    const originalThemeRef = useRef(theme);
    const confirmedThemeRef = useRef(config.ui.theme);

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [themeNames, setThemeNames] = useState<string[]>([]);
    const [themeKeys, setThemeKeys] = useState<string[]>([]);
    const [themeIndex, setThemeIndex] = useState(0);
    const [showAppBackground, setShowAppBackground] = useState(config.ui.showAppBackground);

    const previewTheme = useCallback(async (index: number) => {
        const key = themeKeys[index];
        if (!key) return;
        const t = await themeManager.loadTheme(key);
        useStore.getState().setTheme(t);
    }, [themeKeys]);

    useEffect(() => {
        (async () => {
            const available = await themeManager.listAvailable();
            const names = available.map(key => {
                const builtin = BUILTIN_THEMES[key];
                return builtin ? builtin.name : key;
            });
            setThemeKeys(available);
            setThemeNames(names);
            const currentIdx = available.indexOf(config.ui.theme);
            setThemeIndex(currentIdx >= 0 ? currentIdx : 0);
        })();
    }, []);

    useEffect(() => {
        if (activeTab === 'theme' && themeKeys.length > 0) {
            previewTheme(themeIndex);
        }
    }, [themeIndex, activeTab, themeKeys]);

    useInput((input, key) => {
        if (key.escape) {
            // Revert to last confirmed theme
            const revertKey = confirmedThemeRef.current;
            (async () => {
                const t = await themeManager.loadTheme(revertKey);
                useStore.getState().setTheme(t);
            })();
            onClose();
            return;
        }

        // Tab switching: [, ], left, right
        if (input === '[' || key.leftArrow) {
            setActiveTab(prev => {
                const idx = SETTINGS_TABS.indexOf(prev);
                return SETTINGS_TABS[(idx - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length];
            });
            return;
        }
        if (input === ']' || key.rightArrow) {
            setActiveTab(prev => {
                const idx = SETTINGS_TABS.indexOf(prev);
                return SETTINGS_TABS[(idx + 1) % SETTINGS_TABS.length];
            });
            return;
        }

        if (activeTab === 'general') {
            if (key.return || input === ' ') {
                const newValue = !showAppBackground;
                setShowAppBackground(newValue);
                (async () => {
                    const cfg = await configManager.load();
                    cfg.ui.showAppBackground = newValue;
                    await configManager.save(cfg);
                    useStore.getState().updateConfig({ ui: { ...cfg.ui } });
                })();
            }
        } else if (activeTab === 'theme') {
            if (input === 'j' || key.downArrow) {
                setThemeIndex(prev => Math.min(themeNames.length - 1, prev + 1));
            } else if (input === 'k' || key.upArrow) {
                setThemeIndex(prev => Math.max(0, prev - 1));
            } else if (key.return) {
                const selectedKey = themeKeys[themeIndex];
                if (selectedKey) {
                    confirmedThemeRef.current = selectedKey;
                    (async () => {
                        const t = await themeManager.loadTheme(selectedKey);
                        useStore.getState().setTheme(t);
                        const cfg = await configManager.load();
                        cfg.ui.theme = selectedKey;
                        await configManager.save(cfg);
                        useStore.getState().updateConfig({ ui: { ...cfg.ui } });
                    })();
                    onClose();
                }
            }
        }
    });

    return (
        <Modal title="Settings" width={50}>
            <Box>
                {SETTINGS_TABS.map((tab, index) => {
                    const isActive = tab === activeTab;
                    return (
                        <React.Fragment key={tab}>
                            <Box marginRight={1}>
                                <Text
                                    color={isActive ? theme.colors.modalTitleText : theme.colors.modalHintText}
                                    bold={isActive}
                                    underline={isActive}
                                >
                                    {TAB_LABELS[tab]}
                                </Text>
                            </Box>

                            {index < SETTINGS_TABS.length - 1 && (
                                <Box marginRight={1}>
                                    <Text color={theme.colors.modalHintText}>│</Text>
                                </Box>
                            )}
                        </React.Fragment>
                    );
                })}
            </Box>

            <Box flexDirection="column" marginTop={1}>
                {activeTab === 'general' && (
                    <Box flexDirection="column">
                        <Box>
                            <Text color={theme.colors.selectedItem}>
                                {'▸ '}Show App Background: {' '}
                            </Text>
                            <Text color={showAppBackground ? 'green' : 'gray'} bold>
                                {showAppBackground ? 'ON' : 'OFF'}
                            </Text>
                        </Box>
                    </Box>
                )}
                {activeTab === 'theme' && (
                    <Box flexDirection="column">
                        {themeNames.map((name, index) => (
                            <Box
                                key={name}
                                backgroundColor={index === themeIndex ? theme.colors.selectedItemBg : undefined}
                            >
                                <Text color={index === themeIndex ? theme.colors.selectedItem : theme.colors.modalText}>
                                    {` ${name} `}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            <Box marginTop={1}>
                <Text color={theme.colors.modalHintText}>
                    {activeTab === 'general'
                        ? '[/]: tabs  Enter/Space: toggle  Esc: close'
                        : '[/]: tabs  j/k: navigate  Enter: select  Esc: cancel'}
                </Text>
            </Box>
        </Modal>
    );
}
