import { describe, expect, it } from "vitest";

import { compileMarkdown, transformHexoAssetTags } from "../../lib/content/markdown";

describe("transformHexoAssetTags", () => {
  it("rewrites asset_img tags into markdown image syntax", () => {
    const result = transformHexoAssetTags(
      "Before\n{% asset_img figure-01.svg %}\nAfter",
      "/post-assets/demo"
    );

    expect(result).toContain("![](/post-assets/demo/figure-01.svg)");
  });

  it("rewrites relative png images to generated webp variants", () => {
    const result = transformHexoAssetTags(
      '![Figure](figure-01.png "Example")',
      "/post-assets/demo"
    );

    expect(result).toBe('![Figure](/post-assets/demo/figure-01.webp "Example")');
  });
});

describe("compileMarkdown", () => {
  it("extracts h2-h4 headings for the TOC", () => {
    const result = compileMarkdown("## A\n### B\n#### C", "/post-assets/demo");

    expect(result.headings.map((item) => item.text)).toEqual(["A", "B", "C"]);
    expect(result.contentHtml).toContain("<h2");
  });

  it("adds lazy image loading attributes to article images", () => {
    const result = compileMarkdown("![Figure](figure-01.png)", "/post-assets/demo");

    expect(result.contentHtml).toContain('src="/post-assets/demo/figure-01.webp"');
    expect(result.contentHtml).toContain('loading="lazy"');
    expect(result.contentHtml).toContain('decoding="async"');
    expect(result.contentHtml).toContain('fetchpriority="low"');
  });
});

it("uses rendered heading IDs after duplicate H1/H5 headings and inline formatting", () => {
  const result = compileMarkdown("# Repeat\n\n## Repeat\n\n##### Extra\n\n## Extra\n\n### **Extra**", "/post-assets/test");
  expect(result.headings.map((h) => h.id)).toEqual(["repeat-1", "extra-1", "extra-2"]);
  for (const heading of result.headings) expect(result.contentHtml).toContain(`<h${heading.depth} id="${heading.id}">`);
});
