import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseSnapshotResponse, parsePublishSnapshotResponse } from "@garden-lab/snapshot-contract";
import type { Server } from "node:http";

import { startServer } from "../src/server.js";
import { createWebSessionToken } from "../src/auth.js";
import { CONFIG } from "../src/config.js";

let server: Server;
let baseUrl: string;
let testDataDir: string;

beforeAll(async () => {
  CONFIG.PORT = 8999;
  CONFIG.HOST = "127.0.0.1";
  CONFIG.SNAPSHOT_UPLOAD_TOKEN = "test-garden-snapshot-token";
  CONFIG.SITE_URL = "https://ffffhx.github.io/garden-lab";
  testDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "garden-api-test-"));
  CONFIG.DATA_DIR = testDataDir;

  await fs.mkdir(CONFIG.PRIVATE_BLOG_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CONFIG.PRIVATE_BLOG_DIR, "internship-defense.json"),
    JSON.stringify({
      slug: "internship-defense",
      title: "面试准备：冯鸿鑫",
      dateText: "2026-08-21",
      contentHtml: "<!DOCTYPE html><html><body><h1>面试准备：冯鸿鑫</h1></body></html>",
    }),
    "utf8"
  );
  await fs.writeFile(
    path.join(CONFIG.PRIVATE_BLOG_DIR, "internship-defense.html"),
    "<!DOCTYPE html><html><body><h1>面试准备：冯鸿鑫</h1></body></html>",
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

  it("GET /api/blog/:slug redirects unauthenticated user to GitHub login", async () => {
    const res = await fetch(`${baseUrl}/api/blog/internship-defense`, {
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    const location = res.headers.get("location");
    expect(location).toContain("/api/auth/github/start?returnTo=");
  });

  it("GET /api/blog/:slug serves private post for authorized owner", async () => {
    const ownerToken = createWebSessionToken({
      userId: "github:12345",
      displayName: "冯鸿鑫",
      githubLogin: "ffffhx",
    });

    const res = await fetch(`${baseUrl}/api/blog/internship-defense`, {
      headers: {
        Cookie: `${CONFIG.SESSION_COOKIE_NAME}=${ownerToken}`,
      },
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("冯鸿鑫");
  });

  it("GET /api/blog/:slug returns 403 for unauthorized login", async () => {
    const strangerToken = createWebSessionToken({
      userId: "github:99999",
      displayName: "Stranger",
      githubLogin: "random-user",
    });

    const res = await fetch(`${baseUrl}/api/blog/internship-defense`, {
      headers: {
        Cookie: `${CONFIG.SESSION_COOKIE_NAME}=${strangerToken}`,
      },
    });

    expect(res.status).toBe(403);
    const html = await res.text();
    expect(html).toContain("仅作者本人可见");
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
  });

  it("GET /api/private-posts returns 403 for unauthorized users", async () => {
    const res = await fetch(`${baseUrl}/api/private-posts`);
    expect(res.status).toBe(403);
  });

  const snapshot = { title: "Contract <T>", engine: "codex", redacted: true, turns: [
    { role: "user", text: "const element = <div>Hello</div>" },
    { role: "assistant", text: "Answer", html: '<p class="answer">Answer</p><script>alert(1)</script>' },
  ] };
  const publish = (body: unknown, token = CONFIG.SNAPSHOT_UPLOAD_TOKEN) => fetch(`${baseUrl}/api/snapshots`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
  });

  it("publishes, reads, updates and deletes using the Garden contract", async () => {
    const created = await publish({ schemaVersion: 1, snapshot, shareId: "snap_Ab-C123", expiresInDays: 1 });
    expect(created.status).toBe(201);
    const result = parsePublishSnapshotResponse(await created.json());
    expect(result.url).toBe("https://ffffhx.github.io/garden-lab/snapshots/share/?id=snap_Ab-C123");
    expect(Date.parse(result.expiresAt!)).toBeGreaterThan(Date.now());
    const response = await fetch(`${baseUrl}/garden-api/api/snapshots/${result.id}`);
    expect(response.status).toBe(200);
    const read = parseSnapshotResponse(await response.json());
    expect(read.snapshot.turns[0].text).toBe(snapshot.turns[0].text);
    expect(read.snapshot.title).toBe(snapshot.title);
    expect(read.snapshot.turns[1].html).toBe('<p class="answer">Answer</p>');
    expect(read.share.turnCount).toBe(2);
    expect(read).not.toHaveProperty("ownerUserId");
    const updated = await publish({ snapshot: { ...snapshot, title: "Updated" }, shareId: result.id });
    expect(updated.status).toBe(200);
    const replacement = parsePublishSnapshotResponse(await updated.json());
    expect(replacement.createdAt).toBe(result.createdAt);
    expect(replacement.url).toBe(result.url);
    const other = createWebSessionToken({ userId: "other", displayName: "Other", githubLogin: "other" });
    expect((await publish({ snapshot, shareId: result.id }, other)).status).toBe(403);
    expect((await fetch(`${baseUrl}/api/snapshots/${result.id}`, { method: "DELETE" })).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/snapshots/${result.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${other}` } })).status).toBe(403);
    expect((await fetch(`${baseUrl}/api/snapshots/${result.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${CONFIG.SNAPSHOT_UPLOAD_TOKEN}` } })).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/snapshots/${result.id}`)).status).toBe(404);
  });

  it("rejects invalid envelopes, TTLs, IDs and foreign credentials", async () => {
    expect((await publish({ snapshot }, "old-token-board-token")).status).toBe(401);
    for (const body of [null, { title: "old flat request" }, { snapshot: { turns: "invalid" } },
      { schemaVersion: 2, snapshot }, { snapshot, shareId: "../file" }, { snapshot, expiresInDays: -1 },
      { snapshot, expiresInDays: 0 }, { snapshot, expiresInDays: 1.5 }, { snapshot, siteUrl: "https://untrusted.invalid" }]) {
      expect((await publish(body)).status).toBe(400);
    }
  });

  it("reads existing Garden raw and wrapped records, and enforces expiration", async () => {
    const store = JSON.parse(await fs.readFile(CONFIG.SNAPSHOTS_FILE, "utf8"));
    for (const [id, data] of [["legacy-raw", snapshot], ["legacy-wrapped", { snapshot, siteUrl: "https://old.invalid" }]] as const) {
      store[id] = { id, createdAt: Date.now(), data };
    }
    store.expired = { id: "expired", createdAt: Date.now(), expiresAt: Date.now() - 1000, data: snapshot };
    await fs.writeFile(CONFIG.SNAPSHOTS_FILE, JSON.stringify(store));
    for (const id of ["legacy-raw", "legacy-wrapped"]) {
      const data = parseSnapshotResponse(await (await fetch(`${baseUrl}/api/snapshots/${id}`)).json());
      expect(data.snapshot.turns).toHaveLength(2);
      expect(data.share.url).toContain("https://ffffhx.github.io/garden-lab/");
    }
    expect((await fetch(`${baseUrl}/api/snapshots/expired`)).status).toBe(404);
  });

  it("preserves concurrent publishes and does not replace corrupt storage", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => publish({ snapshot, shareId: `parallel-${i}` })));
    expect(results.map(result => result.status)).toEqual(Array(8).fill(201));
    const raw = await fs.readFile(CONFIG.SNAPSHOTS_FILE, "utf8");
    for (let i = 0; i < 8; i++) expect(JSON.parse(raw)[`parallel-${i}`]).toBeDefined();
    try {
      await fs.writeFile(CONFIG.SNAPSHOTS_FILE, "broken-json");
      expect((await publish({ snapshot })).status).toBe(500);
      expect(await fs.readFile(CONFIG.SNAPSHOTS_FILE, "utf8")).toBe("broken-json");
    } finally { await fs.writeFile(CONFIG.SNAPSHOTS_FILE, raw); }
  });

  it("publishes an actual CLI fixture and reads it with the frontend parser", async () => {
    const fixture = path.join(testDataDir, "fixture.jsonl");
    await fs.writeFile(fixture, [
      { type: "session_meta", payload: { id: "fixture-session", timestamp: new Date().toISOString(), cwd: "/fixture" } },
      { type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "Explain generics" }] } },
      { type: "response_item", payload: { type: "message", role: "assistant", content: [{ type: "output_text", text: "Use Array<T>." }] } },
    ].map(row => JSON.stringify(row)).join("\n"));
    const cli = path.resolve("../../tools/codex-snapshot/bin/codex-snapshot.mjs");
    const configFile = path.join(testDataDir, "garden-snapshot-config.json");
    await fs.writeFile(configFile, JSON.stringify({ token: CONFIG.SNAPSHOT_UPLOAD_TOKEN, apiUrl: baseUrl, siteUrl: "http://localhost:3000" }));
    const { stdout } = await promisify(execFile)(process.execPath, [cli, "publish", fixture, "--codex-home", testDataDir], {
      env: { ...process.env, SNAPSHOT_SHARE_TOKEN: "", GARDEN_SNAPSHOT_UPLOAD_TOKEN: "", SNAPSHOT_SHARE_API_URL: "", GARDEN_API_URL: "", SNAPSHOT_SHARE_SITE_URL: "", GARDEN_SNAPSHOT_CONFIG_FILE: configFile },
    });
    const id = stdout.match(/Share id: ([a-zA-Z0-9_-]+)/)?.[1];
    expect(id).toBeTruthy();
    expect(stdout).toContain(`URL: http://localhost:3000/snapshots/share/?id=${id}`);
    const data = parseSnapshotResponse(await (await fetch(`${baseUrl}/api/snapshots/${id}`)).json());
    expect(data.snapshot.turns.map(turn => turn.text).join("\n")).toContain("Array<T>");
  }, 15000);
});
