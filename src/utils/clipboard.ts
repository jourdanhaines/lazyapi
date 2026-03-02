import { writeFileSync } from "fs";

export function copyToClipboard(text: string): boolean {
    try {
        const encoded = Buffer.from(text).toString("base64");
        writeFileSync("/dev/tty", `\x1b]52;c;${encoded}\x07`);
        return true;
    } catch {
        return false;
    }
}
