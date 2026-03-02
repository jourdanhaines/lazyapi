import React from "react";
import { Box, Text } from "ink";

interface Props {
    message: string;
    hint?: string;
}

export function EmptyState({ message, hint }: Props) {
    return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
            <Text color="gray">{message}</Text>

            {hint && <Text color="gray" italic>{hint}</Text>}
        </Box>
    );
}
