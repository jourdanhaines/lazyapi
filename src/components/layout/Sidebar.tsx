import React from "react";
import { Box } from "ink";
import { Panel } from "./Panel";
import { ProjectSelector } from "../panels/ProjectSelector";
import { RequestTree } from "../panels/RequestTree";

interface Props {
    width: number;
    height: number;
}

export function Sidebar({ width, height }: Props) {
    const projectsHeight = Math.floor(height * 0.25);
    const requestsHeight = height - projectsHeight;

    return (
        <Box flexDirection="column" width={width}>
            <Panel id="projects" title="Projects" height={projectsHeight}>
                <ProjectSelector height={projectsHeight} />
            </Panel>

            <Panel id="requests" title="Requests" height={requestsHeight}>
                <RequestTree height={requestsHeight} />
            </Panel>
        </Box>
    );
}
