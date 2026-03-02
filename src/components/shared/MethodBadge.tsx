import React from "react";
import { Text } from "ink";
import type { HttpMethod } from "../../types/request";
import { getMethodColor } from "../../utils/color";

interface Props {
    method: HttpMethod;
    isCompact?: boolean;
}

export function MethodBadge({ method, isCompact }: Props) {
    const color = getMethodColor(method);
    const label = isCompact ? method.slice(0, 3) : method.padEnd(7);
    return <Text color={color} bold>{label}</Text>;
}
