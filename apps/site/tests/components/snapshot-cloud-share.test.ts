// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodexSnapshotCloudShare } from "../../components/codex-snapshot-cloud-share";

let root: Root | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

async function renderResponse(payload: unknown, ok = true) {
  window.history.replaceState(null, "", "/snapshots/share/?id=snap_ABC");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const request = vi.fn(async (..._args: unknown[]) => ({ ok, status: ok ? 200 : 404, json: async () => payload }));
  vi.stubGlobal("fetch", request);
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root!.render(React.createElement(CodexSnapshotCloudShare, { apiBaseUrl: "https://example.test/garden-api" })); });
  return request;
}

describe("Garden cloud snapshot viewer", () => {
  it("renders a v1 transcript from Garden", async () => {
    const request = await renderResponse({
      schemaVersion: 1,
      share: { id: "snap_ABC", url: "https://example.test/snapshots/share/?id=snap_ABC", title: "Example share", createdAt: "2026-09-09T00:00:00Z", updatedAt: "2026-09-09T00:00:00Z", expiresAt: null, turnCount: 1, redacted: true },
      snapshot: { turns: [{ role: "assistant", text: "Use Array<T> safely." }] },
    });
    expect(request.mock.calls[0]?.[0]).toBe("https://example.test/garden-api/api/snapshots/snap_ABC");
    expect(document.body.textContent).toContain("Example share");
    expect(document.body.textContent).toContain("Use Array<T> safely.");
  });

  it("shows a contract error instead of silently rendering an old envelope", async () => {
    await renderResponse({ id: "snap_ABC", data: { title: "Old response", turns: [] } });
    expect(document.body.textContent).toContain("Unsupported Garden snapshot response");
  });

  it("shows the server's missing or expired error", async () => {
    await renderResponse({ error: "Snapshot not found or expired" }, false);
    expect(document.body.textContent).toContain("Snapshot not found or expired");
  });
});
