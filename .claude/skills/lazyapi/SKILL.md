---
name: lazyapi
description: Run saved lazyapi HTTP requests and inspect responses without leaving Claude Code. Use when the user mentions running, executing, sending, or testing a saved API request, or asks about a lazyapi project, collection, environment, or saved request. Discover available projects with `lazyapi --list-projects` and requests with `lazyapi --list-requests <project>`.
---

# LazyAPI

The user has the `lazyapi` CLI installed locally. It stores saved HTTP requests at `~/.config/lazyapi/projects/*.json` (or `.lazyapi/` inside a git-tracked project) and can execute them headlessly.

## Discover

- `lazyapi --list-projects` — JSON: `{ projects: [{ id, name, requestCount, activeEnvironment, storageMode }] }`
- `lazyapi --list-requests <project-name>` — JSON: `{ project, requests: [{ id, name, method, url, path }] }` (`path` is the folder breadcrumb, empty string at root)

## Execute

- `lazyapi --run -p <project-name> -r <request-id>` — runs the request, prints full `ResponseEntry` JSON to stdout, also appends to the project's history.
- `-e <env-name>` overrides the project's active environment.
- `.env` files in `cwd` are merged into the variable context automatically.

## Response shape (stdout JSON)

```
{
  id, requestId, timestamp,
  request:  { method, url, headers, body? },
  response: { status, statusText, headers, body, size },
  timing:   { startTime, endTime, duration }
}
```

`response.body` is always a string — `JSON.parse` it yourself if the server returned JSON.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Request was sent (any HTTP status — check `response.status` for HTTP-level failures) |
| 2 | Bad CLI usage |
| 3 | Project not found |
| 4 | Request id not found in project |
| 5 | Environment name (`-e`) not found |
| 6 | Unresolved `{{var}}` references (stderr lists them) |
| 7 | Network / timeout / abort (stderr `{error,message}`) |

## Recipe

1. If the user names a project but not a request, run `--list-requests <project>` first and pick the request whose `name`, `method`, or `url` best matches their intent. Always pass the `id` (`req_...`) to `--run`, never the name.
2. Run with `--run -p ... -r ...`. Add `-e <env>` only when the user asked for a specific environment.
3. Parse the stdout JSON. Lead with `response.status` and a short summary of the body. Dump raw body only when status ≥ 400 or the user asks for it.
4. On non-zero exit, surface the stderr JSON verbatim — it explains what went wrong (missing project, unresolved vars, network failure).
