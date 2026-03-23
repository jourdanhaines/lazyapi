import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import type { KeyValuePair } from "../../types/request";
import { tokenizeVariables, classifyVariables, renderVariableTokens } from "../../utils/variableHighlight";
import { buildVariableContext } from "../../utils/variables";

interface Props {
    pairs: KeyValuePair[];
    selectedIndex: number;
    scrollOffset: number;
    visibleCount: number;
    isFocused?: boolean;
}

export function KeyValueEditor({ pairs, selectedIndex, scrollOffset, visibleCount, isFocused = true }: Props) {
    const theme = useStore(s => s.theme);
    const activeEnv = useStore(s => s.getActiveEnvironment());
    const dotEnvVars = useStore(s => s.dotEnvVars);

    const variableContext = useMemo(
        () => buildVariableContext(activeEnv?.variables ?? [], dotEnvVars),
        [activeEnv, dotEnvVars]
    );

    if (pairs.length === 0) {
        return (
            <Box>
                <Text color="gray" italic>No entries. Press 'a' to add.</Text>
            </Box>
        );
    }

    const end = Math.min(scrollOffset + visibleCount, pairs.length);
    const visible = pairs.slice(scrollOffset, end);

    return (
        <Box flexDirection="column">
            {scrollOffset > 0 && <Text color="gray">  ↑ {scrollOffset} more</Text>}

            {visible.map((pair, index) => {
                const actualIndex = scrollOffset + index;
                const isSelected = actualIndex === selectedIndex;
                return (
                    <Box
                        key={actualIndex}
                        backgroundColor={isSelected && isFocused ? theme.colors.selectedItemBg : undefined}
                    >
                        <Text color={pair.enabled ? undefined : 'gray'} strikethrough={!pair.enabled}>
                            {pair.enabled ? '  ' : '  '}{pair.key || '<key>'}
                        </Text>

                        <Text color="gray"> = </Text>

                        {pair.enabled && /\{\{/.test(pair.value) && (
                            <Text>{renderVariableTokens(
                                classifyVariables(tokenizeVariables(pair.value), variableContext),
                                theme.colors.variableValid,
                                theme.colors.variableInvalid
                            )}</Text>
                        )}

                        {!(pair.enabled && /\{\{/.test(pair.value)) && (
                            <Text color={pair.enabled ? undefined : 'gray'} strikethrough={!pair.enabled}>
                                {pair.value || '<value>'}
                            </Text>
                        )}

                        {!pair.enabled && <Text color="gray"> (disabled)</Text>}
                    </Box>
                );
            })}

            {end < pairs.length && <Text color="gray">  ↓ {pairs.length - end} more</Text>}
        </Box>
    );
}
