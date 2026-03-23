import React, { useCallback, useMemo } from "react";
import { Box, Text } from "ink";
import { useStore } from "../../state/store";
import { usePanelFocus } from "../../hooks/usePanelFocus";
import { ScrollableList } from "../shared/ScrollableList";
import type { Project } from "../../types/project";

interface Props {
    height: number;
}

export function ProjectSelector({ height }: Props) {
    const projects = useStore(s => s.projects);
    const activeProjectId = useStore(s => s.activeProjectId);

    const { isFocused } = usePanelFocus('projects');

    const selectedIndex = useMemo(() => {
        const idx = projects.findIndex(p => p.id === activeProjectId);
        return idx >= 0 ? idx : 0;
    }, [projects, activeProjectId]);

    const scrollOffset = useMemo(() => {
        const visible = Math.max(1, height - 2);
        if (selectedIndex < visible) return 0;
        return selectedIndex - visible + 1;
    }, [selectedIndex, height]);

    const theme = useStore(s => s.theme);

    const renderItem = useCallback((project: Project, _index: number, isSelected: boolean) => {
        const envName = project.activeEnvironmentId
            ? project.environments.find(e => e.id === project.activeEnvironmentId)?.name
            : null;

        return (
            <Text>
                <Text color={isSelected ? '#FFFFFF' : undefined}>{project.name}</Text>
                {envName && <Text color={theme.colors.focusedBorder}> [{envName}]</Text>}
            </Text>
        );
    }, [theme]);

    return (
        <ScrollableList
            items={projects}
            selectedIndex={selectedIndex}
            scrollOffset={scrollOffset}
            visibleCount={Math.max(1, height - 2)}
            isFocused={isFocused}
            renderItem={renderItem}
        />
    );
}
