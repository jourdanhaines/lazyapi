import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useStore } from "../../state/store.js";
import { usePanelFocus } from "../../hooks/usePanelFocus.js";
import { useMouseScroll } from "../../hooks/useMouseScroll.js";
import { TabBar } from "../shared/TabBar.js";
import { ContentViewer } from "../shared/ContentViewer.js";
import { EmptyState } from "./EmptyState.js";
import { getStatusColor } from "../../utils/color.js";
import { formatBytes, formatDuration, formatResponseBody, getResponseSyntax } from "../../utils/format.js";
import type { ResponseTab } from "../../types/ui.js";

const RESPONSE_TABS = ['body', 'headers', 'timing', 'history'] as const;
const TAB_LABELS: Record<ResponseTab, string> = {
    body: 'Body',
    headers: 'Headers',
    timing: 'Timing',
    history: 'History',
};

interface Props {
    height: number;
}

export function ResponseViewer({ height }: Props) {
    const response = useStore(s => s.currentResponse);
    const responseHistory = useStore(s => s.responseHistory);
    const isLoading = useStore(s => s.isLoading);
    const error = useStore(s => s.error);
    const responseTab = useStore(s => s.responseTab);

    const { isFocused } = usePanelFocus('response');

    const [scrollOffset, setScrollOffset] = useState(0);

    const syntax = useMemo(() => {
        if (!response) return "none" as const;
        return getResponseSyntax(response.response.headers);
    }, [response]);

    const formattedBody = useMemo(() => {
        if (!response) return "";
        return formatResponseBody(response.response.body, syntax);
    }, [response, syntax]);

    const totalLines = useMemo(() => {
        if (!formattedBody) return 0;
        return formattedBody.split("\n").length;
    }, [formattedBody]);

    const contentHeight = Math.max(1, height - 5);
    const visibleLines = Math.max(1, contentHeight - 1);

    useEffect(() => {
        setScrollOffset(0);
    }, [response, responseTab]);

    const maxOffset = Math.max(0, totalLines - visibleLines);

    useInput((input) => {
        if (responseTab !== "body" || !response) return;

        if (input === "j") {
            setScrollOffset(prev => Math.min(prev + 1, maxOffset));
        }

        if (input === "k") {
            setScrollOffset(prev => Math.max(prev - 1, 0));
        }
    }, { isActive: isFocused });

    const onScrollUp = useCallback(() => {
        setScrollOffset(prev => Math.max(prev - 3, 0));
    }, []);

    const onScrollDown = useCallback(() => {
        setScrollOffset(prev => Math.min(prev + 3, maxOffset));
    }, [maxOffset]);

    useMouseScroll({
        isActive: isFocused && responseTab === "body" && !!response,
        onScrollUp,
        onScrollDown,
    });

    if (isLoading) {
        return (
            <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
                <Text color="cyan">Sending request...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box flexDirection="column">
                <Text color="red" bold>Error</Text>

                <Text color="red">{error}</Text>
            </Box>
        );
    }

    if (!response) {
        return <EmptyState message="No response yet" hint="Send a request with R" />;
    }

    const renderTabContent = () => {
        switch (responseTab) {
            case 'body':
                return (
                    <Box flexDirection="column">
                        <Box marginBottom={1}>
                            <Text color={getStatusColor(response.response.status)} bold>
                                {response.response.status} {response.response.statusText}
                            </Text>
                            <Text color="gray">
                                {' '}| {formatDuration(response.timing.duration)} | {formatBytes(response.response.size)}
                            </Text>
                        </Box>

                        <ContentViewer
                            content={formattedBody}
                            syntax={syntax}
                            scrollOffset={scrollOffset}
                            visibleLines={visibleLines}
                        />
                    </Box>
                );
            case 'headers':
                return (
                    <Box flexDirection="column">
                        {Object.entries(response.response.headers).map(([key, value]) => (
                            <Box key={key}>
                                <Text color="cyan">{key}</Text>
                                <Text color="gray">: </Text>
                                <Text>{value}</Text>
                            </Box>
                        ))}
                    </Box>
                );
            case 'timing':
                return (
                    <Box flexDirection="column">
                        <Box>
                            <Text color="cyan">{'Total:    '.padEnd(14)}</Text>
                            <Text>{formatDuration(response.timing.duration)}</Text>
                        </Box>

                        <Box>
                            <Text color="cyan">{'Started:  '.padEnd(14)}</Text>
                            <Text>{new Date(response.timing.startTime).toLocaleTimeString()}</Text>
                        </Box>

                        <Box>
                            <Text color="cyan">{'Completed:'.padEnd(14)}</Text>
                            <Text>{new Date(response.timing.endTime).toLocaleTimeString()}</Text>
                        </Box>
                    </Box>
                );
            case 'history':
                if (responseHistory.length === 0) {
                    return <Text color="gray" italic>No history</Text>;
                }
                return (
                    <Box flexDirection="column">
                        {responseHistory.map((entry, index) => (
                            <Box key={entry.id}>
                                <Text color={index === 0 ? 'cyan' : undefined}>
                                    {index === 0 ? '▸ ' : '  '}
                                </Text>
                                <Text color={getStatusColor(entry.response.status)}>
                                    {entry.response.status}
                                </Text>
                                <Text color="gray">
                                    {' '}{formatDuration(entry.timing.duration)} - {new Date(entry.timestamp).toLocaleString()}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                );
        }
    };

    return (
        <Box flexDirection="column">
            <TabBar tabs={RESPONSE_TABS} activeTab={responseTab} labels={TAB_LABELS} />

            <Box marginTop={1} flexDirection="column">
                {renderTabContent()}
            </Box>
        </Box>
    );
}
