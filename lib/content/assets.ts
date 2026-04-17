import path from "node:path";

import { withBasePath } from "@/lib/utils/site-path";

function toPosix(value: string) {
  return value.split(path.sep).join("/");
}

export function normalizeAssetUrl(assetBasePath: string, assetName: string) {
  const cleanedBase = assetBasePath.replace(/\/+$/, "");
  const cleanedName = assetName.trim().replace(/^\.?\//, "");
  return `${cleanedBase}/${cleanedName}`;
}

export function getPostAssetBasePath(relativeMarkdownPath: string) {
  const normalized = toPosix(relativeMarkdownPath);
  const parsed = path.posix.parse(normalized);
  return withBasePath(`/post-assets/${parsed.dir}/${parsed.name}`);
}
