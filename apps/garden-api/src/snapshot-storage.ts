import { promises as fs } from "node:fs";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import sanitizeHtml from "sanitize-html";
import { parseCreateSnapshotRequest, parseSnapshot, SNAPSHOT_SCHEMA_VERSION, type SnapshotPayload, type SnapshotResponse } from "@garden-lab/snapshot-contract";
import { readIdentityFromRequest } from "./auth.js";
import { CONFIG } from "./config.js";

export type SnapshotRecord = {
  id: string;
  createdAt: number;
  updatedAt?: number;
  expiresAt?: number | null;
  ownerUserId?: string;
  title?: string;
  siteUrl?: string;
  data: unknown;
};
type SnapshotStore = Record<string, SnapshotRecord>;
let mutationQueue: Promise<unknown> = Promise.resolve();

async function loadStore(): Promise<SnapshotStore> {
  try {
    const store = JSON.parse(await fs.readFile(CONFIG.SNAPSHOTS_FILE, "utf8"));
    if (!store || typeof store !== "object" || Array.isArray(store)) throw new Error("Invalid snapshot store");
    return store;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

function mutateStore<T>(change: (store: SnapshotStore) => T): Promise<T> {
  const operation = mutationQueue.then(async () => {
    const store = await loadStore();
    const result = change(store);
    const file = CONFIG.SNAPSHOTS_FILE;
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(store, null, 2), "utf8");
      await fs.rename(temporary, file);
    } finally {
      await fs.unlink(temporary).catch(() => {});
    }
    return result;
  });
  mutationQueue = operation.catch(() => {});
  return operation;
}

class SnapshotError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function publisher(req: IncomingMessage): string | null {
  const configured = CONFIG.SNAPSHOT_UPLOAD_TOKEN;
  const supplied = req.headers.authorization?.replace(/^Bearer /, "") || "";
  const suppliedBytes = Buffer.from(supplied);
  const configuredBytes = Buffer.from(configured);
  if (configured && suppliedBytes.length === configuredBytes.length && timingSafeEqual(suppliedBytes, configuredBytes)) return "garden:snapshot-publisher";
  return readIdentityFromRequest(req)?.userId || null;
}

function shareSite(value = CONFIG.SITE_URL): string {
  const url = new URL(value);
  const configured = new URL(CONFIG.SITE_URL);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash ||
      (url.origin !== configured.origin && !CONFIG.ALLOWED_ORIGINS.includes(url.origin.toLowerCase()))) {
    throw new Error("Invalid snapshot siteUrl");
  }
  return url.href.replace(/\/+$/, "");
}

function toResponse(record: SnapshotRecord): SnapshotResponse {
  // The original Garden API saved both raw payloads and { snapshot, ... } envelopes.
  const data = record.data as { snapshot?: unknown } | null;
  const original = parseSnapshot(data?.snapshot ?? record.data);
  const snapshot = sanitizeSnapshot(original);
  const site = record.siteUrl || CONFIG.SITE_URL;
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    share: {
      id: record.id,
      url: `${site.replace(/\/+$/, "")}/snapshots/share/?id=${encodeURIComponent(record.id)}`,
      title: snapshot.title || record.title || "Session Snapshot",
      engine: snapshot.engine,
      engineLabel: snapshot.engineLabel,
      createdAt: new Date(record.createdAt).toISOString(),
      updatedAt: new Date(record.updatedAt ?? record.createdAt).toISOString(),
      expiresAt: record.expiresAt ? new Date(record.expiresAt).toISOString() : null,
      redacted: snapshot.redacted === true,
      turnCount: snapshot.turns.length,
    },
    snapshot,
  };
}

function sanitizeSnapshot(snapshot: SnapshotPayload): SnapshotPayload {
  // Plain transcript text may contain source code such as <T> or <div>.
  // Sanitize only HTML rendered as markup; keep text, metadata and image data intact.
  return { ...snapshot, turns: snapshot.turns.map(turn => ({
    ...turn,
    ...(turn.html !== undefined ? { html: sanitizeHtml(turn.html, { allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] } }) } : {}),
  })) };
}

function existingRecord(store: SnapshotStore, id: string) {
  return Object.hasOwn(store, id) ? store[id] : undefined;
}

function unexpired(record: SnapshotRecord | undefined): record is SnapshotRecord {
  return Boolean(record && (!record.expiresAt || record.expiresAt > Date.now()));
}

export async function handleCreateSnapshot(req: IncomingMessage, res: ServerResponse, body: unknown): Promise<void> {
  const owner = publisher(req);
  if (!owner) { sendJson(res, 401, { error: "Garden authentication required to publish snapshots" }); return; }
  let input;
  let siteUrl;
  try {
    input = parseCreateSnapshotRequest(body);
    siteUrl = shareSite(input.siteUrl);
  } catch (error) {
    sendJson(res, 400, { error: (error as Error).message }); return;
  }
  const id = input.shareId || randomBytes(12).toString("hex");
  const snapshot = sanitizeSnapshot(input.snapshot);
  try {
    const result = await mutateStore(store => {
      const previous = existingRecord(store, id);
      if (previous && previous.ownerUserId !== owner) throw new SnapshotError(403, "Not authorized to replace this snapshot");
      const now = Date.now();
      const record: SnapshotRecord = { id, createdAt: previous?.createdAt ?? now, updatedAt: now,
        expiresAt: input.expiresInDays ? now + input.expiresInDays * 86400000 : previous?.expiresAt ?? null,
        ownerUserId: owner, title: snapshot.title, siteUrl, data: snapshot };
      store[id] = record;
      return { record, status: previous ? 200 : 201 };
    });
    const { share } = toResponse(result.record);
    sendJson(res, result.status, { schemaVersion: SNAPSHOT_SCHEMA_VERSION, ...share });
  } catch (error) {
    if (!(error instanceof SnapshotError)) throw error;
    sendJson(res, error.status, { error: error.message });
  }
}

export async function handleGetSnapshot(_req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
  const record = existingRecord(await loadStore(), id);
  if (!unexpired(record)) { sendJson(res, 404, { error: "Snapshot not found or expired" }); return; }
  sendJson(res, 200, toResponse(record));
}

export async function handleDeleteSnapshot(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
  const owner = publisher(req);
  if (!owner) { sendJson(res, 401, { error: "Garden authentication required" }); return; }
  try {
    await mutateStore(store => {
      const record = existingRecord(store, id);
      if (!record) throw new SnapshotError(404, "Snapshot not found");
      if (record.ownerUserId !== owner) throw new SnapshotError(403, "Not authorized to delete this snapshot");
      delete store[id];
    });
    sendJson(res, 200, { success: true });
  } catch (error) {
    if (!(error instanceof SnapshotError)) throw error;
    sendJson(res, error.status, { error: error.message });
  }
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
