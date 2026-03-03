import { spawnSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync, rmdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export function getExternalEditor(): string | null {
    return process.env.VISUAL || process.env.EDITOR || null;
}

const BODY_TYPE_EXTENSIONS: Record<string, string> = {
    json: ".json",
    xml: ".xml",
    text: ".txt",
    raw: ".txt",
};

export function openInExternalEditor(content: string, bodyType: string): string | null {
    const editorEnv = getExternalEditor();
    if (!editorEnv) return null;

    const parts = editorEnv.split(/\s+/);
    const command = parts[0];
    const editorArgs = parts.slice(1);

    const extension = BODY_TYPE_EXTENSIONS[bodyType] ?? ".txt";
    const tempDir = mkdtempSync(join(tmpdir(), "lazyapi-"));
    const tempFile = join(tempDir, `body${extension}`);

    try {
        writeFileSync(tempFile, content, "utf-8");

        const wasRaw = process.stdin.isRaw;
        if (wasRaw) {
            process.stdin.setRawMode(false);
        }

        const result = spawnSync(command, [...editorArgs, tempFile], {
            stdio: "inherit",
            env: process.env,
        });

        if (wasRaw) {
            process.stdin.setRawMode(true);
        }

        // Re-enter alternate screen buffer. Editors like vim/nvim exit it
        // with \x1b[?1049l, leaving us in the main buffer. Without this,
        // the app renders in the main buffer and quitting fails to restore
        // the terminal properly.
        process.stdout.write("\x1b[?1049h");

        if (result.error || result.status !== 0) {
            return null;
        }

        return readFileSync(tempFile, "utf-8");
    } finally {
        try { unlinkSync(tempFile); } catch {}
        try { rmdirSync(tempDir); } catch {}
    }
}

export function getEditorName(): string | null {
    const editor = getExternalEditor();
    if (!editor) return null;
    const command = editor.split(/\s+/)[0];
    return command.split("/").pop() ?? null;
}
