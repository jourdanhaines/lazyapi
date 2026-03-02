# LazyAPI

A terminal UI API client inspired by lazygit. Build, organize, and send HTTP requests without leaving your terminal.

## Install

### Quick install (Linux / macOS)

```sh
curl -fsSL -H "Authorization: token $(gh auth token)" \
    https://raw.githubusercontent.com/flux-interactive/lazyapi/main/install.sh | sudo sh
```

Requires the [GitHub CLI](https://cli.github.com/) (`gh auth login`). Install without sudo to a user directory:

```sh
curl -fsSL -H "Authorization: token $(gh auth token)" \
    https://raw.githubusercontent.com/flux-interactive/lazyapi/main/install.sh | INSTALL_DIR=~/.local/bin sh
```

### From source

```sh
bun install
bun run build
```

## Usage

```
lazyapi [options]
```

| Option | Description |
|---|---|
| `--project <name>` | Open a specific project |
| `--help`, `-h` | Show help |
| `--version`, `-v` | Show version |

## Layout

The interface has 4 panels, navigable with Tab/Shift+Tab, arrow keys, or 1-4:

| Panel | Purpose |
|---|---|
| Projects | Manage API projects |
| Requests | Organize requests in a tree with folders |
| Editor | Edit URL, params, headers, and body |
| Response | View response body, headers, timing, and history |

## Keybindings

### Global

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Cycle panels |
| `←` / `→` | Switch panels |
| `1-4` | Focus panel directly |
| `?` | Help |
| `q` | Quit |

### Projects

| Key | Action |
|---|---|
| `j/k` | Navigate |
| `a` | Add project |
| `e` | Edit name |
| `d` | Delete project |
| `s` | Settings |
| `J/K` | Reorder |

### Requests

| Key | Action |
|---|---|
| `j/k` | Navigate |
| `a` | Add request |
| `A` | Add folder |
| `e` | Edit name |
| `d` | Delete |
| `Enter` | Select / toggle folder |
| `J/K` | Reorder |

### Editor

| Key | Action |
|---|---|
| `[` / `]` | Switch tab |
| `j/k` | Navigate entries |
| `e` | Edit field |
| `a` | Add entry |
| `d` | Delete entry |
| `Space` | Toggle enabled |
| `m` | Change HTTP method (URL tab) |
| `t` | Change body type (Body tab) |
| `y` | Copy to clipboard |
| `R` | Send request |

### Text Input

| Key | Action |
|---|---|
| `Enter` | Confirm |
| `Esc` | Cancel |
| `Ctrl+W` | Delete last word |

## Themes

6 built-in themes: Default, Monokai, Dracula, Nord, Gruvbox, and Catppuccin.

Change theme via `s` in the Projects panel. Custom themes can be added as JSON files in `~/.config/lazyapi/themes/`.

## Data

All data is stored in `~/.config/lazyapi/` (respects `XDG_CONFIG_HOME`).
