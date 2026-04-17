#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const sourceImagesRoot = path.join(cwd, "source", "images");
const postsRoot = path.join(cwd, "source", "_posts");
const publicRoot = path.join(cwd, "public");
const publicImagesRoot = path.join(publicRoot, "images");
const publicPostAssetsRoot = path.join(publicRoot, "post-assets");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(sourcePath, targetPath) {
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function walk(dir, visitor) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, visitor);
      continue;
    }

    visitor(fullPath);
  }
}

fs.rmSync(publicRoot, { recursive: true, force: true });
ensureDir(publicImagesRoot);
ensureDir(publicPostAssetsRoot);

walk(sourceImagesRoot, (filePath) => {
  const relative = path.relative(sourceImagesRoot, filePath);
  copyFile(filePath, path.join(publicImagesRoot, relative));
});

walk(postsRoot, (filePath) => {
  if (filePath.endsWith(".md")) {
    return;
  }

  const relative = path.relative(postsRoot, filePath);
  copyFile(filePath, path.join(publicPostAssetsRoot, relative));
});
