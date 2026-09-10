import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";

import { startServer } from "../src/server.js";
import { createWebSessionToken } from "../src/auth.js";
import { CONFIG } from "../src/config.js";

let server: Server;
let baseUrl: string;
let testDataDir: string;

beforeAll(async () => {
  CONFIG.SITE_URL = "http://localhost:3000/garden-lab";
  CONFIG.PORT = 8999;
  CONFIG.HOST = "127.0.0.1";
  testDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "garden-api-test-"));
  CONFIG.DATA_DIR = testDataDir;

  await fs.mkdir(CONFIG.PRIVATE_BLOG_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CONFIG.PRIVATE_BLOG_DIR, "internship-defense.json"),
    JSON.stringify({
      slug: "internship-defense",
      title: "面试准备：冯鸿鑫",
      dateText: "2026-08-21",
      content: "# Private Markdown\n\nAuthor only.",
      contentHtml: "<!DOCTYPE html><html><body><h1>面试准备：冯鸿鑫</h1></body></html>",
    }),
    "utf8"
  );

  server = startServer();
  baseUrl = `http://127.0.0.1:8999`;
  await new Promise((resolve) => setTimeout(resolve, 300));
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  if (testDataDir) {
    await fs.rm(testDataDir, { recursive: true, force: true }).catch(() => {});
  }
});

describe("Garden Lab API", () => {
  it("GET /health returns 200 ok", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("garden-api");
  });

  it("GET /api/auth/me returns unauthenticated when no cookie provided", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
  });

  it.each([undefined, "ffffhx", "random-user"])(
    "redirects the old article URL to the same reader for %s", async (login) => {
      const token = login ? createWebSessionToken({
        userId: "github:12345", displayName: "Test", githubLogin: login,
      }) : "";
      const res = await fetch(`${baseUrl}/api/blog/internship-defense?garden_token=secret&returnTo=https://untrusted.invalid`, {
        redirect: "manual",
        headers: token ? { Cookie: `${CONFIG.SESSION_COOKIE_NAME}=${token}` } : {},
      });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/garden-lab/private-post/?slug=internship-defense"
      );
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.text()).toBe("");
    }
  );

  it.each([undefined, "random-user"])("protects article JSON for %s", async (login) => {
    const token = login ? createWebSessionToken({
      userId: "github:99999", displayName: "Test", githubLogin: login,
    }) : "";
    const res = await fetch(`${baseUrl}/api/private-posts/internship-defense`, {
      headers: token ? { Cookie: `${CONFIG.SESSION_COOKIE_NAME}=${token}` } : {},
    });
    expect(res.status).toBe(403);
    expect(await res.text()).not.toContain("contentHtml");
  });

  it("GET /api/private-posts lists private posts for authorized owner", async () => {
    const ownerToken = createWebSessionToken({
      userId: "github:12345",
      displayName: "冯鸿鑫",
      githubLogin: "ffffhx",
    });

    const res = await fetch(`${baseUrl}/api/private-posts`, {
      headers: {
        Cookie: `${CONFIG.SESSION_COOKIE_NAME}=${ownerToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.posts)).toBe(true);
    expect(body.posts.some((p: any) => p.slug === "internship-defense")).toBe(true);
    expect(body.posts[0]).not.toHaveProperty("content");
    expect(body.posts[0]).not.toHaveProperty("contentHtml");
  });

  it("GET /api/private-posts/:slug returns full post JSON for authorized owner", async () => {
    const ownerToken = createWebSessionToken({
      userId: "github:12345",
      displayName: "冯鸿鑫",
      githubLogin: "ffffhx",
    });

    const res = await fetch(`${baseUrl}/api/private-posts/internship-defense`, {
      headers: {
        Cookie: `${CONFIG.SESSION_COOKIE_NAME}=${ownerToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe("internship-defense");
    expect(body.title).toContain("冯鸿鑫");
    expect(body.contentHtml).toBeDefined();
    expect(body.content).toBe("# Private Markdown\n\nAuthor only.");
  });

  it("GET /api/private-posts returns 403 for unauthorized users", async () => {
    const res = await fetch(`${baseUrl}/api/private-posts`);
    expect(res.status).toBe(403);
  });

});
