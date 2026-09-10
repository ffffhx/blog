import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { Post, PrivatePostData } from "./types";
import { normalizeBasePath } from "../utils/site-path";
import { rewriteMarkdownUrls } from "./markdown-export";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
};

type ExportOptions = {
  siteRoot: string;
  outputDir: string;
  slug?: string;
  basePath?: string;
};

function inlineAsset(url: string, options: ExportOptions): string {
  const basePath = normalizeBasePath(options.basePath ?? process.env.NEXT_PUBLIC_BASE_PATH);
  const localUrl = basePath && url.startsWith(`${basePath}/`) ? url.slice(basePath.length) : url;
  const match = localUrl.match(/^\/(post-assets|images)\/([^?#]+)(?:[?#].*)?$/);
  if (!match) return url;
  const [, folder, relativeUrl] = match;
  const relativePath = decodeURIComponent(relativeUrl);
  const root = path.join(options.siteRoot, "source", folder === "post-assets" ? "_posts" : "images");
  // Hidden images have no public WebP derivative. Resolve back to the source.
  const requested = path.resolve(root, relativePath);
  const candidates = [requested];
  if (/\.webp$/i.test(requested)) {
    candidates.push(...[".png", ".jpg", ".jpeg", ".PNG", ".JPG", ".JPEG"].map((ext) => requested.replace(/\.webp$/i, ext)));
  }
  for (const candidate of candidates) {
    const relative = path.relative(root, candidate);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Asset is outside its source directory: ${url}`);
    }
    if (existsSync(candidate)) {
      const mime = MIME_TYPES[path.extname(candidate).toLowerCase()];
      if (!mime) throw new Error(`Unsupported image format: ${url}`);
      return `data:${mime};base64,${readFileSync(candidate).toString("base64")}`;
    }
  }
  throw new Error(`Missing private article image: ${url}. Check the source image path.`);
}

export function exportPrivatePosts(posts: Post[], options: ExportOptions): string[] {
  const slug = options.slug || "all";
  const selected = posts.filter((post) => post.hidden && (slug === "all" || post.slug === slug));
  if (slug !== "all" && !selected.length) {
    throw new Error(`Private post not found: ${slug}. Set hidden: true in its frontmatter.`);
  }

  // Prepare every record before writing so a missing image cannot leave a partial export.
  const records = selected.map((post) => {
    if (!/^[a-z0-9-]+$/.test(post.slug)) {
      throw new Error(`Private post requires an ASCII slug in frontmatter: ${post.sourcePath}`);
    }
    const { date, content, sourcePath, ...data } = post;
    const record: PrivatePostData = {
      ...data,
      content: rewriteMarkdownUrls(content, (url) => inlineAsset(url, options)),
      cover: post.cover ? inlineAsset(post.cover, options) : null,
      contentHtml: post.contentHtml.replace(/(\bsrc=["'])([^"']+)(["'])/g,
        (_, prefix, url, suffix) => `${prefix}${inlineAsset(url, options)}${suffix}`),
    };
    return record;
  });

  mkdirSync(options.outputDir, { recursive: true });
  for (const record of records) {
    const target = path.join(options.outputDir, `${record.slug}.json`);
    const temporary = `${target}.tmp`;
    writeFileSync(temporary, JSON.stringify(record, null, 2));
    renameSync(temporary, target);
  }
  // Existing records without local Markdown remain intact (they may be the only copy).
  return records.map((record) => record.slug);
}
