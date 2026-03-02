# Claude Code Project Guidelines

## Code Style
- **Indentation**: Always use 4 spaces for TS/JS/JSON files
- **Package manager**: Always use Bun (never npm/yarn/pnpm)

## Tech Stack
- **Runtime**: Bun
- **Framework**: Ink 6 (React-based TUI) with React 19
- **State**: Zustand 5 (single store with slices)
- **Language**: TypeScript 5, ESM modules (NodeNext)
- **Testing**: Vitest 3

## Key Architecture
- 4-panel lazygit-style layout: Projects, Requests, Editor, Response
- Keybinding system: global (Tab, arrows, 1-4, q, ?) + panel-scoped (j/k, a, d, etc.)
- Data stored at ~/.config/lazyapi/ (XDG_CONFIG_HOME respected)
- Theme system: builtin themes + custom themes in ~/.config/lazyapi/themes/

## React Style Guide

### Spacing
- **Indentation**: 4 spaces, never tabs
- **Hook ordering**: non-destructured → destructured → state → memo → callback → functions → effect hooks. Blank line between each group.
- **Derived variables**: go after all hooks, separated by a blank line
- **JSX siblings**: separate sibling elements at the same level with a blank line. First child needs no space above, last needs no space below. Does NOT apply to inline `<Text>` fragments composing a single visual line.

### Short Circuiting
- Never combine short-circuit (`&&`) with ternary (`? :`). Split into two separate `&&` checks for readability.

### Guard Clause
- Never nest `if` statements deeper than 2 levels. Invert conditions and return early instead of nesting.

### Naming
- **Files**: component name = file name (e.g., `Navbar` component → `Navbar.tsx`)
- **Variables**: descriptive names, never lazy abbreviations (`hasNotification` not `hasN`). Use `index` not `i` in loops.
- **Booleans**: prefix with `is` or `has` (e.g., `isDisabled`, `hasNotification`)
- **Callbacks**: prefix with `on` + action (e.g., `onCreate`, `onClose`)

### Folder Structure
- Structure files/folders to mirror application flow. Group shared components together, break non-shared into context-specific folders (e.g., `dashboard/navigation`, `admin/navigation`).

### Abstraction
- Extract large sections that perform a specific task into their own component file (e.g., a drawer with buttons → `ItemDrawer.tsx`).

### Attribute Value Character
- Use double quotes `"` for string attribute values, curly braces `{}` only for non-string values.
```tsx
// Good
<Component heading="Edit" onComplete={handleSubmit} />
// Bad
<Component heading={"Edit"} />
```

### Component Function Attribute
- Single-statement inline functions: omit block braces (`onClick={() => doThing()}`)
- Multi-statement functions: extract to a named function and pass by reference
```tsx
// Bad:  onClick={() => { doA(); doB(); }}
// Good: function handleClick() { doA(); doB(); }
//        onClick={handleClick}
```

### Component Props Type
- Order props by: short names first → group similar names (e.g., `is*` together) → functions last
- Internal-only props: use `type Props = { ... }`
- Exported/shared props: use `interface ComponentNameProps { ... }`

## Important Notes
- Ink 6 requires React 19 (react-reconciler 0.33 needs React 19's SharedInternals.S)
- @inkjs/ui v2 TextInput uses `defaultValue` not `value` prop
- cli.tsx uses dynamic imports to avoid loading React/Ink for --help/--version
- Send request keybinding is 'R' (Shift+R)
