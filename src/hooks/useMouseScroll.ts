import { useEffect } from "react";
import { useStdin } from "ink";

interface MouseScrollOptions {
    isActive: boolean;
    onScrollUp: () => void;
    onScrollDown: () => void;
}

export function useMouseScroll({ isActive, onScrollUp, onScrollDown }: MouseScrollOptions) {
    const { stdin, setRawMode } = useStdin();

    useEffect(() => {
        if (!isActive) return;

        // Enable SGR mouse mode (button tracking + SGR extended coordinates)
        process.stdout.write("\x1b[?1000h\x1b[?1006h");

        function handleData(data: Buffer) {
            const str = data.toString();

            // SGR mouse format: \x1b[<button;col;rowM (press) or \x1b[<button;col;rowm (release)
            const match = str.match(/\x1b\[<(\d+);\d+;\d+[Mm]/);
            if (!match) return;

            const button = parseInt(match[1], 10);

            if (button === 64) {
                onScrollUp();
            } else if (button === 65) {
                onScrollDown();
            }
        }

        stdin.on("data", handleData);

        return () => {
            stdin.off("data", handleData);
            process.stdout.write("\x1b[?1000l\x1b[?1006l");
        };
    }, [isActive, onScrollUp, onScrollDown, stdin]);
}
