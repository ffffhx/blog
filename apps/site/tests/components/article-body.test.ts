import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArticleBody } from "../../components/article-body";

describe("ArticleBody", () => {
  it("renders article text and image settings", () => {
    const markup = renderToStaticMarkup(
      createElement(ArticleBody, {
        html: "<p>正文内容</p>",
        slug: "demo-post",
      })
    );

    expect(markup).toContain('id="article-content-demo-post"');
    expect(markup).toContain('data-content-image-size="default"');
    expect(markup).toContain("正文内容");
  });
});
