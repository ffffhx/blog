import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const siteRoot = fileURLToPath(new URL("../", import.meta.url));
const guard = fileURLToPath(new URL("./dev-memory-guard.cjs", import.meta.url))
  .replaceAll("\\", "/");
let nodeOptions = process.env.NODE_OPTIONS || "";
// Next 15 otherwise gives its server half of total RAM, regardless of how
// much memory other desktop applications are already using.
if (!/--max[-_]old[-_]space[-_]size(?:=|\s)/.test(nodeOptions)) {
  nodeOptions += " --max-old-space-size=1536";
}
nodeOptions += ` --require="${guard}"`;

const child = spawn(process.execPath, [
  require.resolve("next/dist/bin/next"), "dev",
  // An explicit port fails on a duplicate start instead of silently starting
  // a second server that writes to the same .next directory.
  "--hostname", "127.0.0.1", "--port", "3000",
  ...process.argv.slice(2),
], {
  cwd: siteRoot,
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: nodeOptions.trim() },
});
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
