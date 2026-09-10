import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, it, vi } from "vitest";

vi.mock("../../lib/content/markdown", () => ({
  transformHexoAssetTags: (source: string) => source,
  compileMarkdown: vi.fn((source: string) => ({ content: source, contentHtml: `<p>${source}</p>`, headings: [] })),
}));

it("refreshes edits, additions and deletions in development and compiles bodies only on demand", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "garden-post-cache-"));
  fs.mkdirSync(path.join(root, "source/_posts"), { recursive: true });
  const write = (name: string, title: string) => fs.writeFileSync(path.join(root, `source/_posts/${name}.md`), `---\ntitle: ${title}\ndate: 2026-09-10\n---\n${title}`);
  write("one", "First");
  const cwd = vi.spyOn(process, "cwd").mockReturnValue(root);
  vi.stubEnv("NODE_ENV", "development");
  try {
    const posts = await import("../../lib/content/posts");
    const { compileMarkdown } = await import("../../lib/content/markdown");
    expect(posts.getAllPosts()[0].title).toBe("First");
    expect(compileMarkdown).not.toHaveBeenCalled();
    expect(posts.getPostBySlug("one")?.contentHtml).toContain("First");
    expect(posts.getPostBySlug("one")?.contentHtml).toContain("First");
    expect(compileMarkdown).toHaveBeenCalledTimes(1);
    write("one", "Edited title");
    expect(posts.getAllPosts()[0].title).toBe("Edited title");
    expect(posts.getPostBySlug("one")?.contentHtml).toContain("Edited title");
    write("two", "New post");
    expect(posts.getAllPosts()).toHaveLength(2);
    fs.unlinkSync(path.join(root, "source/_posts/one.md"));
    expect(posts.getPostBySlug("one")).toBeNull();
    expect(posts.getAllPosts()).toHaveLength(1);
  } finally {
    cwd.mockRestore();
    vi.unstubAllEnvs();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
