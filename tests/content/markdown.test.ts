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
});

describe("compileMarkdown", () => {
  it("extracts h2-h4 headings for the TOC", () => {
    const result = compileMarkdown("## A\n### B\n#### C", "/post-assets/demo");

    expect(result.headings.map((item) => item.text)).toEqual(["A", "B", "C"]);
    expect(result.contentHtml).toContain("<h2");
  });
});
