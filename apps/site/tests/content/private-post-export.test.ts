import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exportPrivatePosts } from "../../lib/content/private-post-export";
import type { Post } from "../../lib/content/types";

let root: string;
let outputDir: string;
function post(slug: string, overrides: Partial<Post> = {}): Post {
  return {
    slug, title: "Test", excerpt: "", categories: ["tech"], tags: [],
    date: new Date("2026-09-09"), dateText: "2026-09-09", readingTimeText: "1 min",
    assetBasePath: "/post-assets/test", cover: null, coverPosition: "above-title",
    hidden: true, content: "# Test", contentHtml: "<h1>Test</h1>",
    contentImageSize: "default", headings: [], sourcePath: `${slug}.md`, ...overrides,
  };
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "garden-private-export-"));
  outputDir = path.join(root, "data", "private-blog");
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe("private article export", () => {
  it("exports newly added hidden posts without a manual list, HTML or a Next build", () => {
    const result = exportPrivatePosts([post("new-private"), post("public", { hidden: false })], {
      siteRoot: root, outputDir,
    });
    expect(result).toEqual(["new-private"]);
    expect(fs.readdirSync(outputDir)).toEqual(["new-private.json"]);
    const data = JSON.parse(fs.readFileSync(path.join(outputDir, "new-private.json"), "utf8"));
    expect(data.contentHtml).toBe("<h1>Test</h1>");
    expect(data).not.toHaveProperty("sourcePath");
    expect(data).not.toHaveProperty("content");
    expect(data).not.toHaveProperty("date");
  });

  it("inlines cover and body images with a Pages base path using the same resolver", () => {
    const imageDir = path.join(root, "source", "_posts", "test");
    fs.mkdirSync(imageDir, { recursive: true });
    fs.writeFileSync(path.join(imageDir, "cover.svg"), "<svg/>");
    const url = "/garden-lab/post-assets/test/cover.svg";
    exportPrivatePosts([post("images", { cover: url, contentHtml: `<img src="${url}">` })], {
      siteRoot: root, outputDir, basePath: "/garden-lab",
    });
    const data = JSON.parse(fs.readFileSync(path.join(outputDir, "images.json"), "utf8"));
    expect(data.cover).toBe(`data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`);
    expect(data.contentHtml).toBe(`<img src="${data.cover}">`);
  });

  it("preserves records whose Markdown is no longer present", () => {
    fs.mkdirSync(outputDir, { recursive: true });
    const legacy = path.join(outputDir, "legacy.json");
    fs.writeFileSync(legacy, '{"title":"Only remaining copy"}');
    exportPrivatePosts([post("new-private")], { siteRoot: root, outputDir });
    expect(fs.readFileSync(legacy, "utf8")).toBe('{"title":"Only remaining copy"}');
  });

  it("exports only the requested private slug and rejects unknown or public slugs", () => {
    const posts = [post("one"), post("two"), post("public", { hidden: false })];
    exportPrivatePosts(posts, { siteRoot: root, outputDir, slug: "two" });
    expect(fs.readdirSync(outputDir)).toEqual(["two.json"]);
    for (const slug of ["missing", "public"]) {
      expect(() => exportPrivatePosts(posts, { siteRoot: root, outputDir, slug })).toThrow("Private post not found");
    }
  });

  it("fails before writing records when an image is missing", () => {
    expect(() => exportPrivatePosts([post("one"), post("two", { cover: "/images/missing.png" })], {
      siteRoot: root, outputDir,
    })).toThrow("Missing private article image");
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  it("rejects slugs that the private article API cannot serve", () => {
    expect(() => exportPrivatePosts([post("中文")], { siteRoot: root, outputDir })).toThrow("ASCII slug");
  });
});
