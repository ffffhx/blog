// @vitest-environment jsdom

import { act, createElement } from "react";
import { Blob as NodeBlob } from "node:buffer";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ArticleMarkdownActions, copyMarkdown } from "../../components/article-markdown-actions";

let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function renderActions() {
  await import("../../lib/content/markdown-export");
  await act(async () => root.render(createElement(ArticleMarkdownActions, {
    title: "中文标题", content: "## 正文\n\n**保留格式**",
  })));
  await vi.waitFor(async () => {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    expect(document.querySelector("button")?.disabled).toBe(false);
  });
  return Array.from(document.querySelectorAll("button"));
}

it("copies and downloads the same full Markdown, then releases the download URL", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  const blobs: NodeBlob[] = [];
  vi.stubGlobal("Blob", NodeBlob);
  const createURL = vi.fn((blob: NodeBlob) => { blobs.push(blob); return "blob:test"; });
  const revokeURL = vi.fn();
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: createURL, revokeObjectURL: revokeURL }));
  let filename = "";
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { filename = this.download; });
  const buttons = await renderActions();
  await act(async () => buttons[0].click());
  const markdown = writeText.mock.calls[0][0];
  expect(markdown).toContain("# 中文标题\n");
  expect(markdown).toContain("**保留格式**");
  expect(document.querySelector('[role="status"]')?.textContent).toBe("已复制 Markdown");
  vi.useFakeTimers();
  await act(async () => buttons[1].click());
  expect(click).toHaveBeenCalledOnce();
  expect(filename).toBe("中文标题.md");
  expect(blobs[0].type).toBe("text/markdown;charset=utf-8");
  expect(await blobs[0].text()).toBe(markdown);
  expect(document.querySelector("a[download]")).toBeNull();
  await act(async () => vi.advanceTimersByTime(60_000));
  expect(revokeURL).toHaveBeenCalledWith("blob:test");
});

it("falls back when Clipboard API is denied and restores focus", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
  const copy = vi.fn(() => true);
  Object.defineProperty(document, "execCommand", { configurable: true, value: copy });
  const button = document.createElement("button");
  document.body.append(button);
  button.focus();
  await copyMarkdown("# 示例");
  expect(copy).toHaveBeenCalledWith("copy");
  expect(document.querySelector("textarea")).toBeNull();
  expect(document.activeElement).toBe(button);
});

it("shows selected Markdown for manual copy when both clipboard methods fail", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  Object.defineProperty(document, "execCommand", { configurable: true, value: () => false });
  const buttons = await renderActions();
  await act(async () => buttons[0].click());
  const textarea = document.querySelector("textarea")!;
  expect(textarea.value).toContain("# 中文标题");
  expect(textarea.selectionEnd).toBe(textarea.value.length);
  expect(document.activeElement).toBe(textarea);
  expect(buttons[1].disabled).toBe(false);
});
