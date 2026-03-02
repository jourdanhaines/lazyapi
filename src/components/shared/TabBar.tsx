import React from "react";
import { Box, Text } from "ink";

interface Props<T extends string> {
    tabs: readonly T[];
    activeTab: T;
    labels?: Record<T, string>;
}

export function TabBar<T extends string>({ tabs, activeTab, labels }: Props<T>) {
    return (
        <Box>
            {tabs.map((tab, index) => {
                const isActive = tab === activeTab;
                const label = labels?.[tab] ?? tab;
                return (
                    <Box key={tab} marginRight={1}>
                        <Text
                            color={isActive ? 'cyan' : 'gray'}
                            bold={isActive}
                            underline={isActive}
                        >
                            {label}
                        </Text>

                        {index < tabs.length - 1 && <Text color="gray"> │</Text>}
                    </Box>
                );
            })}
        </Box>
    );
}
