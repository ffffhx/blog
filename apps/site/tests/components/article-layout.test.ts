import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ArticleLayout } from "../../components/article-layout";
import type { PrivatePostData } from "../../lib/content/types";

const post: PrivatePostData = {
  slug: "demo", title: "Shared title", excerpt: "", categories: ["tech"], tags: [],
  dateText: "2026-09-10", readingTimeText: "1 min", assetBasePath: "/post-assets/demo",
  cover: "/cover.svg", coverPosition: "below-title", hidden: true,
  contentHtml: "<p>Shared body</p>", contentImageSize: "half", headings: [],
};
it("shares body, cover ordering and image settings while preserving the private badge", () => {
  const publicHtml = renderToStaticMarkup(createElement(ArticleLayout, { post }));
  const privateHtml = renderToStaticMarkup(createElement(ArticleLayout, { post, privateArticle: true }));
  for (const html of [publicHtml, privateHtml]) {
    expect(html).toContain("Shared body");
    expect(html).toContain('data-content-image-size="half"');
    expect(html.indexOf("<h1")).toBeLessThan(html.indexOf('<img'));
  }
  expect(privateHtml).toContain('title="\u4ec5\u81ea\u5df1\u53ef\u89c1"');
  expect(publicHtml).not.toContain('title="\u4ec5\u81ea\u5df1\u53ef\u89c1"');
});
