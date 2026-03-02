import React from "react";
import { Box } from "ink";
import { Panel } from "./Panel";
import { RequestEditor } from "../panels/RequestEditor";
import { ResponseViewer } from "../panels/ResponseViewer";

interface Props {
    height: number;
}

export function MainContent({ height }: Props) {
    const editorHeight = Math.floor(height * 0.4);
    const responseHeight = height - editorHeight;

    return (
        <Box flexDirection="column" flexGrow={1}>
            <Panel id="editor" title="Request Editor" height={editorHeight}>
                <RequestEditor height={editorHeight} />
            </Panel>

            <Panel id="response" title="Response" height={responseHeight}>
                <ResponseViewer height={responseHeight} />
            </Panel>
        </Box>
    );
}
