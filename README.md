# LazyAPI

A terminal UI API client inspired by lazygit. Build, organize, and send HTTP requests without leaving your terminal.

## Install

### Quick install (Linux / macOS)

```sh
curl -fsSL https://raw.githubusercontent.com/jourdanhaines/lazyapi/main/install.sh | sudo sh
```

Install without sudo to a user directory:

```sh
curl -fsSL https://raw.githubusercontent.com/jourdanhaines/lazyapi/main/install.sh | sh
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

## Headless mode

Run a saved request from the CLI without launching the TUI. The full response (status, headers, body, timing) is printed to stdout as JSON; the request is also appended to history.

```sh
lazyapi --run -p blacksheep -r req_hz1x9kzz4t_W
lazyapi --run -p blacksheep -r req_hz1x9kzz4t_W -e staging
```

Discovery:

```sh
lazyapi --list-projects                  # JSON of all projects
lazyapi --list-requests blacksheep       # JSON of requests in a project
```

Variable interpolation uses the project's active environment plus any `.env` files in the current directory. Override the env with `-e <env-name>`.

Exit codes: `0` = request sent (check `response.status` for HTTP errors), `2` = bad usage, `3` = project not found, `4` = request id not found, `5` = env not found, `6` = unresolved `{{var}}` refs, `7` = network/timeout failure.

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
