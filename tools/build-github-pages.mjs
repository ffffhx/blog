#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repository = process.env.GITHUB_REPOSITORY || "";
const owner = (process.env.GITHUB_REPOSITORY_OWNER || repository.split("/")[0] || "").toLowerCase();
const repoName = repository.split("/")[1] || "";

if (!owner || !repoName) {
  console.error("缺少 GITHUB_REPOSITORY 或 GITHUB_REPOSITORY_OWNER，无法生成 GitHub Pages 的 Hexo 配置。");
  process.exit(1);
}

const isUserOrOrgSite = repoName.toLowerCase() === `${owner}.github.io`;
const siteUrl = isUserOrOrgSite ? `https://${owner}.github.io` : `https://${owner}.github.io/${repoName}`;
const siteRoot = isUserOrOrgSite ? "/" : `/${repoName}/`;
const tempConfigPath = path.join(os.tmpdir(), `hexo-pages-${process.pid}.yml`);
const dbPath = path.join(process.cwd(), "db.json");

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "", "utf8");
}

fs.writeFileSync(tempConfigPath, `url: ${siteUrl}\nroot: ${siteRoot}\n`, "utf8");

const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(
  pnpmCmd,
  ["exec", "hexo", "generate", "--config", `_config.yml,${tempConfigPath}`],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  },
);

try {
  fs.unlinkSync(tempConfigPath);
} catch {
  // Ignore cleanup failures for temporary files.
}

process.exit(result.status ?? 1);
