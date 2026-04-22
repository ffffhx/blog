import { afterEach, describe, expect, it } from "vitest";

import { getPostAssetBasePath, resolvePostAssetUrl } from "../../lib/content/assets";

const ORIGINAL_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH;

afterEach(() => {
  if (ORIGINAL_BASE_PATH === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    return;
  }

  process.env.NEXT_PUBLIC_BASE_PATH = ORIGINAL_BASE_PATH;
});

describe("getPostAssetBasePath", () => {
  it("prefixes post asset paths with the configured site base path", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/blog";

    expect(
      getPostAssetBasePath("2026/04/15/openai-codex-源码解析-它为什么必须是一个带-harness-的本地-agent.md")
    ).toBe(
      "/blog/post-assets/2026/04/15/openai-codex-源码解析-它为什么必须是一个带-harness-的本地-agent"
    );
  });
});

describe("resolvePostAssetUrl", () => {
  it("resolves relative cover assets against the post asset directory", () => {
    expect(resolvePostAssetUrl("/post-assets/demo", "cover-v2.png")).toBe(
      "/post-assets/demo/cover-v2.png"
    );
  });
});
