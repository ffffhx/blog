// Keep defaults in a cross-platform Node entry point; preserve caller overrides.
import { fileURLToPath } from "node:url";
process.env.SNAPSHOT_SHARE_API_URL ||= process.env.GARDEN_API_URL || "https://124-221-36-36.anyip.dev:8443/garden-api";
process.env.SNAPSHOT_SHARE_SITE_URL ||= "https://ffffhx.github.io/garden-lab";
const args = process.argv.slice(2);
process.argv = [process.execPath, fileURLToPath(new URL("../bin/codex-snapshot.mjs", import.meta.url)),
  ...(args.includes("--help") ? ["--help"] : ["serve", "--port", "4321", ...args])];
await import("../bin/codex-snapshot.mjs");
