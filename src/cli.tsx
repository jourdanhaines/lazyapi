const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
lazyapi - Terminal UI API Client

Usage:
    lazyapi [options]

Options:
    --help, -h        Show this help message
    --version, -v     Show version
    --project <name>  Open a specific project by name

Keybindings:
    Tab / Shift+Tab   Cycle panels
    1-4               Focus panel directly
    j/k               Navigate lists
    a                 Add item
    e                 Edit field
    d                 Delete item
    space             Toggle enabled
    t                 Change body type
    R                 Send request
    [ ]               Switch tabs
    ?                 Show help
    q                 Quit
`);
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
    console.log(`lazyapi v${pkg.version}`);
    process.exit(0);
}

let projectName: string | undefined;
const projectIdx = args.indexOf('--project');
if (projectIdx !== -1 && args[projectIdx + 1]) {
    projectName = args[projectIdx + 1];
}

// Dynamic import to avoid loading React/Ink for --help/--version
const React = await import('react');
const { render } = await import('ink');
const { App } = await import('./app.js');

// Use alternate screen buffer so TUI output is cleared on exit
const restoreScreen = () => process.stdout.write('\x1b[?1049l');
process.stdout.write('\x1b[?1049h');
process.on('SIGINT', () => { restoreScreen(); process.exit(0); });
process.on('SIGTERM', () => { restoreScreen(); process.exit(0); });

const instance = render(React.createElement(App, { projectName }));
instance.waitUntilExit().then(restoreScreen);
