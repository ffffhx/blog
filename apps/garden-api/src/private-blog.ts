import { promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

import { isGithubLoginAllowed, readIdentityFromRequest } from "./auth.js";
import { CONFIG } from "./config.js";

const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function handleListPrivatePosts(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const identity = readIdentityFromRequest(req);

  if (!identity || !isGithubLoginAllowed(identity.githubLogin)) {
    sendJson(res, 403, { error: "Forbidden", message: "Only the author can access private posts" });
    return;
  }

  try {
    const dirEntries = await fs.readdir(CONFIG.PRIVATE_BLOG_DIR, { withFileTypes: true });
    const jsonFiles = dirEntries.filter(
      (entry) => entry.isFile() && entry.name.endsWith(".json") && entry.name !== "snapshots.json"
    );

    const posts: any[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(CONFIG.PRIVATE_BLOG_DIR, file.name);
        const raw = await fs.readFile(filePath, "utf8");
        const data = JSON.parse(raw);
        // Exclude contentHtml from list payload to keep response lightweight
        const { contentHtml, ...summary } = data;
        posts.push(summary);
      } catch {
        // skip malformed JSON files
      }
    }

    // Sort by date or title if available
    posts.sort((a, b) => {
      const dateA = a.dateText ? new Date(a.dateText).getTime() : 0;
      const dateB = b.dateText ? new Date(b.dateText).getTime() : 0;
      return dateB - dateA;
    });

    sendJson(res, 200, { posts });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      sendJson(res, 200, { posts: [] });
    } else {
      sendJson(res, 500, { error: "Failed to read private posts" });
    }
  }
}

export async function handleGetPrivatePostJson(
  req: IncomingMessage,
  res: ServerResponse,
  slug: string
): Promise<void> {
  if (!SLUG_REGEX.test(slug)) {
    sendJson(res, 400, { error: "Invalid slug parameter" });
    return;
  }

  const identity = readIdentityFromRequest(req);

  if (!identity || !isGithubLoginAllowed(identity.githubLogin)) {
    sendJson(res, 403, { error: "Forbidden", message: "Only the author can access private posts" });
    return;
  }

  const jsonFilePath = path.join(CONFIG.PRIVATE_BLOG_DIR, `${slug}.json`);

  try {
    const raw = await fs.readFile(jsonFilePath, "utf8");
    const data = JSON.parse(raw);
    sendJson(res, 200, data);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      sendJson(res, 404, { error: "Private post not found" });
    } else {
      sendJson(res, 500, { error: "Failed to read private post" });
    }
  }
}

// The legacy URL only selects a post; the site's JSON reader handles login and UI.
export function handlePrivateBlogRedirect(res: ServerResponse, slug: string): void {
  if (!SLUG_REGEX.test(slug)) {
    sendJson(res, 400, { error: "Invalid slug parameter" });
    return;
  }
  const target = new URL(`${CONFIG.SITE_URL}/private-post/`);
  target.searchParams.set("slug", slug);
  res.statusCode = 302;
  res.setHeader("Location", target.href);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}

function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
