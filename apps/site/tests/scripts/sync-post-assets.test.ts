import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it("publishes public assets and removes previously published hidden companions", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "garden-assets-"));
  const write = (file: string, content: string) => {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };
  try {
    write("source/_posts/hidden.md", "---\nhidden: true\n---\nPrivate");
    write("source/_posts/hidden/nested/secret.svg", "<svg/>");
    write("public/post-assets/hidden/old.svg", "old-private");
    write("source/_posts/public.md", "---\nhidden: false\n---\nPublic");
    write("source/_posts/public/cover.svg", "<svg/>");
    write("source/_posts/hidden-other/cover.svg", "<svg/>");
    execFileSync(process.execPath, [path.resolve("scripts/sync-post-assets.mjs")], { cwd: root });
    expect(fs.existsSync(path.join(root, "public/post-assets/hidden"))).toBe(false);
    expect(fs.existsSync(path.join(root, "public/post-assets/public/cover.svg"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public/post-assets/hidden-other/cover.svg"))).toBe(true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
