import React, { useMemo, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { TextInputField } from "../shared/TextInputField";
import { useStore } from "../../state/store";
import { usePanelFocus } from "../../hooks/usePanelFocus";
import { useTerminalSize } from "../../hooks/useTerminalSize";
import { TabBar } from "../shared/TabBar";
import { KeyValueEditor } from "../shared/KeyValueEditor";
import { ContentViewer } from "../shared/ContentViewer";
import { MultiLineEditor } from "../shared/MultiLineEditor";
import { MethodBadge } from "../shared/MethodBadge";
import { EmptyState } from "./EmptyState";
import { projectManager } from "../../services/ProjectManager";
import { updateNode } from "../../utils/tree";
import { getEditorName } from "../../utils/externalEditor";
import type { EditorTab } from "../../types/ui";

const EDITOR_TABS = ['url', 'params', 'headers', 'body'] as const;
const TAB_LABELS: Record<EditorTab, string> = {
    url: 'URL',
    params: 'Params',
    headers: 'Headers',
    body: 'Body',
};

interface Props {
    height: number;
}

export function RequestEditor({ height }: Props) {
    const request = useStore(s => s.getSelectedRequest());
    const editorTab = useStore(s => s.editorTab);
    const editorItemIndex = useStore(s => s.editorItemIndex);
    const inputMode = useStore(s => s.inputMode);
    const theme = useStore(s => s.theme);

    const { isFocused } = usePanelFocus('editor');
    const { columns } = useTerminalSize();

    const urlRef = useRef("");

    const isEditingUrl = inputMode && editorTab === 'url';
    const isEditingBody = inputMode && editorTab === 'body';

    useInput((_input, key) => {
        if (key.escape) {
            useStore.getState().setInputMode(false);
        }
    }, { isActive: isEditingUrl });

    if (!request) {
        return <EmptyState message="No request selected" hint="Select a request from the tree" />;
    }

    const contentHeight = Math.max(1, height - 4);

    function handleUrlSubmit(value: string) {
        const store = useStore.getState();
        const project = store.getActiveProject();
        if (!project) return;

        const selectedRequest = store.getSelectedRequest();
        if (!selectedRequest) return;

        const newCollection = updateNode(project.collection, selectedRequest.id, { url: value });
        store.updateCollection(project.id, newCollection);
        projectManager.saveDebounced({ ...project, collection: newCollection });
        store.setInputMode(false);
    }

    function handleBodySave(content: string) {
        const store = useStore.getState();
        const project = store.getActiveProject();
        if (!project) return;

        const selectedRequest = store.getSelectedRequest();
        if (!selectedRequest) return;

        const newCollection = updateNode(project.collection, selectedRequest.id, {
            body: { ...selectedRequest.body, content },
        } as any);
        store.updateCollection(project.id, newCollection);
        projectManager.saveDebounced({ ...project, collection: newCollection });
        store.setInputMode(false);
    }

    function handleBodyCancel() {
        useStore.getState().setInputMode(false);
    }

    function kvScrollOffset(pairCount: number, visible: number) {
        if (editorItemIndex < visible) return 0;
        return Math.min(editorItemIndex - visible + 1, Math.max(0, pairCount - visible));
    }

    const KV_HINT = "a: add  e: edit  d: delete  space: toggle";

    const renderTabContent = () => {
        switch (editorTab) {
            case 'url': {
                // sidebar=30%, panel border+padding=4, method badge=7, margin=1, inner padding=1
                const sidebarWidth = Math.max(25, Math.floor(columns * 0.3));
                const urlWidth = columns - sidebarWidth - 4 - 7 - 1 - 1;

                return (
                    <Box flexDirection="column">
                        <Box>
                            <MethodBadge method={request.method} />

                            <Box marginLeft={1} width={Math.max(1, urlWidth)} backgroundColor={theme.colors.inputBackground}>
                                {isEditingUrl ? (
                                    <Box paddingLeft={1}>
                                        <TextInputField
                                            defaultValue={request.url}
                                            placeholder="Enter URL..."
                                            onChange={(value) => { urlRef.current = value; }}
                                            onSubmit={handleUrlSubmit}
                                        />
                                    </Box>
                                ) : (
                                    <Text>
                                        {` ${request.url || 'Enter URL...'}`.padEnd(Math.max(1, urlWidth))}
                                    </Text>
                                )}
                            </Box>
                        </Box>

                        <Box marginTop={1}>
                            {isEditingUrl ? (
                                <Text color="gray">Enter to save, Esc to cancel</Text>
                            ) : (
                                <Text color="gray">e: edit URL  m: change method</Text>
                            )}
                        </Box>
                    </Box>
                );
            }
            case 'params': {
                const visible = contentHeight - 1;
                return (
                    <Box flexDirection="column">
                        <KeyValueEditor
                            pairs={request.params}
                            selectedIndex={editorItemIndex}
                            scrollOffset={kvScrollOffset(request.params.length, visible)}
                            visibleCount={visible}
                            isFocused={isFocused}
                        />

                        <Box marginTop={1}>
                            <Text color="gray">{KV_HINT}</Text>
                        </Box>
                    </Box>
                );
            }
            case 'headers': {
                const visible = contentHeight - 1;
                return (
                    <Box flexDirection="column">
                        <KeyValueEditor
                            pairs={request.headers}
                            selectedIndex={editorItemIndex}
                            scrollOffset={kvScrollOffset(request.headers.length, visible)}
                            visibleCount={visible}
                            isFocused={isFocused}
                        />

                        <Box marginTop={1}>
                            <Text color="gray">{KV_HINT}</Text>
                        </Box>
                    </Box>
                );
            }
            case 'body':
                return (
                    <Box flexDirection="column">
                        <Text color="gray">Type: {request.body.type} <Text color="gray" dimColor>(t to change)</Text></Text>

                        {request.body.type === 'none' && (
                            <Text color="gray" italic>No body</Text>
                        )}

                        {request.body.type === 'form' && (
                            <Box flexDirection="column">
                                <KeyValueEditor
                                    pairs={request.body.formData}
                                    selectedIndex={editorItemIndex}
                                    scrollOffset={kvScrollOffset(request.body.formData.length, contentHeight - 2)}
                                    visibleCount={contentHeight - 2}
                                    isFocused={isFocused}
                                />

                                <Box marginTop={1}>
                                    <Text color="gray">{KV_HINT}</Text>
                                </Box>
                            </Box>
                        )}

                        {request.body.type !== 'none' && request.body.type !== 'form' && isEditingBody && (
                            <Box flexDirection="column">
                                <MultiLineEditor
                                    defaultValue={request.body.content}
                                    visibleLines={contentHeight - 2}
                                    isActive={isEditingBody}
                                    syntax={request.body.type === 'json' ? 'json' : 'none'}
                                    onSave={handleBodySave}
                                    onCancel={handleBodyCancel}
                                />

                                <Box marginTop={1}>
                                    <Text color="gray">Ctrl+S: save  Esc: cancel</Text>
                                </Box>
                            </Box>
                        )}

                        {request.body.type !== 'none' && request.body.type !== 'form' && !isEditingBody && (
                            <Box flexDirection="column">
                                <ContentViewer
                                    content={request.body.content}
                                    syntax={request.body.type === 'json' ? 'json' : 'none'}
                                    scrollOffset={0}
                                    visibleLines={contentHeight - 2}
                                    placeholder="Press 'e' to edit body"
                                />

                                <Box marginTop={1}>
                                    <Text color="gray">
                                        {getEditorName()
                                            ? `e: edit body (${getEditorName()})`
                                            : "e: edit body"}
                                    </Text>
                                </Box>
                            </Box>
                        )}
                    </Box>
                );
        }
    };

    return (
        <Box flexDirection="column">
            <TabBar tabs={EDITOR_TABS} activeTab={editorTab} labels={TAB_LABELS} />

            <Box marginTop={1} flexDirection="column">
                {renderTabContent()}
            </Box>
        </Box>
    );
}
