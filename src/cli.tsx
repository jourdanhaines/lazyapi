import { VERSION } from './version';

const args = process.argv.slice(2);

function valueAfter(...flags: string[]): string | undefined {
    for (const flag of flags) {
        const idx = args.indexOf(flag);
        if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    }
    return undefined;
}

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
lazyapi - Terminal UI API Client

Usage:
    lazyapi [options]

Options:
    --help, -h               Show this help message
    --version, -v            Show version
    --project <name>         Open a specific project (TUI)

Headless Mode:
    --run -p <name> -r <id>  Send a saved request, print response JSON to stdout
        -e <env-name>        Override the project's active environment
    --list-projects          Print JSON list of projects
    --list-requests <name>   Print JSON list of requests for a project

Examples:
    lazyapi --run -p blacksheep -r req_hz1x9kzz4t_W
    lazyapi --run -p blacksheep -r req_hz1x9kzz4t_W -e staging
    lazyapi --list-projects | jq
    lazyapi --list-requests blacksheep | jq

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
    console.log(`lazyapi v${VERSION}`);
    process.exit(0);
}

if (args.includes('--list-projects')) {
    const { listProjects } = await import('./headless.js');
    process.exit(await listProjects());
}

if (args.includes('--list-requests')) {
    const projectName = valueAfter('--list-requests');
    if (!projectName) {
        console.error('Error: --list-requests requires a project name');
        process.exit(2);
    }
    const { listRequests } = await import('./headless.js');
    process.exit(await listRequests(projectName));
}

if (args.includes('--run')) {
    const project = valueAfter('-p', '--project');
    const request = valueAfter('-r', '--request');
    const env = valueAfter('-e', '--env');
    if (!project || !request) {
        console.error('Error: --run requires -p <project> and -r <request-id>');
        process.exit(2);
    }
    const { runHeadless } = await import('./headless.js');
    process.exit(await runHeadless({ project, request, env }));
}

let projectName: string | undefined;
const projectIdx = args.indexOf('--project');
if (projectIdx !== -1 && args[projectIdx + 1]) {
    projectName = args[projectIdx + 1];
}

// Dynamic import to avoid loading React/Ink for --help/--version/headless
const React = await import('react');
const { render } = await import('ink');
const { App } = await import('./app.js');
const { setInkClear } = await import('./inkInstance.js');

// Use alternate screen buffer so TUI output is cleared on exit
const restoreScreen = () => process.stdout.write('\x1b[?1049l');
process.stdout.write('\x1b[?1049h');
process.on('SIGINT', () => { restoreScreen(); process.exit(0); });
process.on('SIGTERM', () => { restoreScreen(); process.exit(0); });

const instance = render(React.createElement(App, { projectName }));
setInkClear(() => instance.clear());
instance.waitUntilExit().then(restoreScreen);
