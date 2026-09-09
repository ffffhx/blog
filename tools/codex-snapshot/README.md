# Codex Snapshot

Read-only snapshots for local Codex sessions.

This tool scans local Codex JSONL session files, renders a safe transcript preview, flags likely sharing risks, and exports a static HTML or Markdown snapshot. It never writes back to Codex session files and it never resumes or executes a session.

## Usage

```bash
pnpm snapshot list
pnpm snapshot preview <session-id>
pnpm snapshot export <session-id> --html --output snapshot.html
pnpm snapshot export <session-id> --md --output snapshot.md
pnpm snapshot serve --port 4321
pnpm snapshot:daemon
pnpm snapshot record-trae --port 4732
```

The default Codex home is `$CODEX_HOME` or `~/.codex`.

## macOS LaunchAgent

Install the local snapshot viewer as a macOS user LaunchAgent:

```bash
pnpm snapshot:install-daemon
```

After installation, macOS starts `pnpm snapshot:daemon` when you log in and keeps
`http://127.0.0.1:4321/` available for the website's private snapshot module and
cloud sync button.

Useful maintenance commands:

```bash
pnpm snapshot:daemon:status
pnpm snapshot:daemon:logs
pnpm snapshot:uninstall-daemon
```

Cloud publish uses Garden API. It reads a Garden session token or snapshot upload
token from `SNAPSHOT_SHARE_TOKEN`, `GARDEN_SNAPSHOT_UPLOAD_TOKEN`, or the `token`
field in `~/.garden-snapshot.json` (override the file with `GARDEN_SNAPSHOT_CONFIG_FILE`).
The upload token must match the server's `GARDEN_SNAPSHOT_UPLOAD_TOKEN`.
The LaunchAgent plist does not store the token. Existing agents must be reinstalled
with `pnpm snapshot:install-daemon` to replace their old API URL.

The config file also accepts `apiUrl` and `siteUrl`. CLI flags and environment
variables take precedence over these saved defaults.
Without saved configuration, the CLI defaults to `http://127.0.0.1:8787`; the daemon defaults to the production
Garden API. Override either with `SNAPSHOT_SHARE_API_URL` or `GARDEN_API_URL`.
Share pages use `SNAPSHOT_SHARE_SITE_URL` / `--site-url`; this is the website URL,
not the API URL. The server validates it against its configured site and origins.

```bash
pnpm snapshot publish <session-id> --api-url https://124-221-36-36.anyip.dev:8443/garden-api
```

Protocol and deployment settings: [Garden snapshot contract](../../docs/snapshot-contract.md).

## Trae Local Recorder

Trae does not always keep full assistant replies in readable local storage. The recorder is an explicit, local-only capture layer for your own Trae window:

```bash
pnpm snapshot record-trae --port 4732
```

Then open Trae DevTools for the Trae window you want to record and run:

```js
import("http://127.0.0.1:4732/trae-recorder.js")
```

If dynamic import is blocked:

```js
fetch("http://127.0.0.1:4732/trae-recorder.js").then((r) => r.text()).then((code) => (0, eval)(code))
```

The injected recorder hooks `fetch`, fetch response streams, `WebSocket`, and `EventSource`, then stores local JSONL capture events under `~/.codex-snapshot/trae-recordings`. The normal web UI lists these under the Trae module as `local recorder` sessions.

By default it records full request/response message bodies and stream chunks, but does not persist headers. Use `--record-sensitive-context` only when you also want request/response headers saved locally for protocol debugging:

```bash
pnpm snapshot record-trae --port 4732 --record-sensitive-context
```

## Safety Model

- Exports user and assistant messages by default.
- Skips developer/system/bootstrap messages.
- Hides tool calls unless `--include-tools` is passed.
- Hides tool output unless `--include-tool-output` is passed.
- Redacts common secrets, bearer tokens, JWTs, private key blocks, cookies, and local home paths.
- Produces static snapshots only; recipients cannot continue or operate the original thread.
- Trae recorder capture is opt-in per window and writes only to a local directory you control.

The redactor is intentionally conservative but not perfect. Review the risk panel before sharing exported files.
