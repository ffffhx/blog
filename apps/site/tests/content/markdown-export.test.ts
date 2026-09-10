import { describe, expect, it } from "vitest";
import { createMarkdownExport, markdownFilename, rewriteMarkdownUrls } from "../../lib/content/markdown-export";

describe("Markdown article export", () => {
  it("exports authored Markdown with a title, GFM and portable links without altering code", async () => {
    const content = [
      "## 内容", "", "[文章](/garden-lab/post/demo/)", "![图](/garden-lab/post-assets/图.webp)",
      "![引用][picture]", "", "[picture]: /garden-lab/images/photo.png", "", "[段落](#内容)", "",
      "| 名称 | 状态 |", "| --- | --- |", "| 中文 | **保留** |", "", "- [x] 完成", "",
      '```md\n![示例](/not-an-image.png)\n<img src="/example.png">\n```', "",
      '<video poster="/poster.webp"><source src="/movie.mp4"></video>',
    ].join("\n");
    const result = await createMarkdownExport({ title: "中文：导出", content, contentHtml: "<p>ignore</p>" }, "https://example.com/garden-lab/post/demo/");
    expect(result.filename).toBe("中文：导出.md");
    expect(result.markdown).toMatch(/^# 中文：导出\n/);
    expect(result.markdown).toContain("https://example.com/garden-lab/post/demo/");
    expect(result.markdown).toContain("https://example.com/garden-lab/post-assets/%E5%9B%BE.webp");
    expect(result.markdown).toContain("[picture]: https://example.com/garden-lab/images/photo.png");
    expect(result.markdown).toContain("[段落](#内容)");
    expect(result.markdown).toContain("- [x] 完成");
    expect(result.markdown).toContain("**保留**");
    expect(result.markdown).toContain('```md\n![示例](/not-an-image.png)\n<img src="/example.png">\n```');
    expect(result.markdown).toContain('poster="https://example.com/poster.webp"');
    expect(result.markdown).toContain('src="https://example.com/movie.mp4"');
    expect(result.markdown).not.toContain("ignore");
  });

  it("keeps an authored opening title and data images", async () => {
    const result = await createMarkdownExport({ title: "Title", content: "# Title\n\n![图](data:image/png;base64,YQ==)", contentHtml: "" }, "https://example.com/post/title/");
    expect(result.markdown.match(/^# Title/gm)).toHaveLength(1);
    expect(result.markdown).toContain("data:image/png;base64,YQ==");
  });

  it("recovers older private HTML as Markdown with tables and clean code", async () => {
    const result = await createMarkdownExport({ title: "Old private", contentHtml: '<h2>正文</h2><pre class="shiki"><code class="language-js"><span>const a = 1;</span>\n</code></pre><table><thead><tr><th>项目</th></tr></thead><tbody><tr><td>保留</td></tr></tbody></table>' }, "https://example.com/private-post/?slug=old&token=do-not-export");
    expect(result.markdown).toContain("# Old private");
    expect(result.markdown).toContain("## 正文");
    expect(result.markdown).toContain("```js\nconst a = 1;\n```");
    expect(result.markdown).toMatch(/\| 项目\s*\|/);
    expect(result.markdown).not.toContain("<span>");
    expect(result.markdown).not.toContain("do-not-export");
  });

  it("uses safe cross-platform filenames while preserving Chinese", () => {
    expect(markdownFilename('中文 / Windows: "测试"?')).toBe("中文 - Windows- -测试--.md");
    expect(markdownFilename("CON")).toBe("_CON.md");
    expect(markdownFilename("  ...  ")).toBe("article.md");
    expect(Array.from(markdownFilename("长".repeat(150))).length).toBe(83);
  });

  it("rewrites private assets in references without touching inline code", () => {
    const output = rewriteMarkdownUrls('![photo][ref]\n\n[ref]: /post-assets/photo.png\n\n`![example](/post-assets/photo.png)`', (url) => url === "/post-assets/photo.png" ? "data:image/png;base64,YQ==" : url);
    expect(output).toContain("[ref]: data:image/png;base64,YQ==");
    expect(output).toContain("`![example](/post-assets/photo.png)`");
  });
});
