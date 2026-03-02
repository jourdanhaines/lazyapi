import React, { useEffect } from "react";
import { Box } from "ink";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { StatusBar } from "./StatusBar";
import { ModalManager } from "../modals/ModalManager";
import { useTerminalSize } from "../../hooks/useTerminalSize";
import { useStore } from "../../state/store";

function setTerminalBackground(color: string) {
    process.stdout.write(`\x1b]11;${color}\x07`);
}

function resetTerminalBackground() {
    process.stdout.write(`\x1b]111\x07`);
}

export function Layout() {
    const showAppBackground = useStore(s => s.config.ui.showAppBackground);
    const appBackground = useStore(s => s.theme.colors.appBackground);

    const { columns, rows } = useTerminalSize();

    const sidebarWidth = Math.max(25, Math.floor(columns * 0.3));
    const contentHeight = rows - 2; // Reserve 2 rows for status bar

    useEffect(() => {
        if (!showAppBackground) {
            resetTerminalBackground();
            return;
        }

        setTerminalBackground(appBackground);

        const onExit = () => resetTerminalBackground();
        process.on('exit', onExit);

        return () => {
            resetTerminalBackground();
            process.removeListener('exit', onExit);
        };
    }, [showAppBackground, appBackground]);

    return (
        <Box flexDirection="column" width={columns} height={rows}>
            <Box flexGrow={1}>
                <Sidebar width={sidebarWidth} height={contentHeight} />
                <MainContent height={contentHeight} />
            </Box>

            <StatusBar />

            <ModalManager />
        </Box>
    );
}
