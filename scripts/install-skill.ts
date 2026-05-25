#!/usr/bin/env bun
import { mkdir, symlink, cp, lstat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const force = args.includes('--force');
const copyMode = args.includes('--copy');

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '..', '.claude', 'skills', 'lazyapi');
const destParent = join(homedir(), '.claude', 'skills');
const dest = join(destParent, 'lazyapi');

if (!existsSync(source)) {
    console.error(`Source skill not found: ${source}`);
    process.exit(1);
}

await mkdir(destParent, { recursive: true });

if (existsSync(dest)) {
    if (!force) {
        console.error(`Skill already installed at ${dest}`);
        console.error('Pass --force to overwrite.');
        process.exit(1);
    }
    const stat = await lstat(dest);
    if (stat.isSymbolicLink() || stat.isFile()) {
        await unlink(dest);
    } else {
        const { rm } = await import('node:fs/promises');
        await rm(dest, { recursive: true, force: true });
    }
}

if (copyMode) {
    await cp(source, dest, { recursive: true });
    console.log(`Copied lazyapi skill to ${dest}`);
} else {
    await symlink(source, dest, 'dir');
    console.log(`Symlinked lazyapi skill: ${dest} -> ${source}`);
}

console.log('Skills hot-reload — no Claude Code restart needed.');
