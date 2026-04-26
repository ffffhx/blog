import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "../../components/site-header";

describe("SiteHeader", () => {
  it("uses high-contrast hover styles for navigation links", () => {
    const markup = renderToStaticMarkup(createElement(SiteHeader));

    expect(markup).toContain("hover:bg-amber-100");
    expect(markup).toContain("hover:text-slate-950");
    expect(markup).not.toContain("hover:bg-slate-950");
    expect(markup).not.toContain("hover:text-white");
  });

  it("includes the games entry in the primary navigation", () => {
    const markup = renderToStaticMarkup(createElement(SiteHeader));

    expect(markup).toContain('href="/games"');
    expect(markup).toContain(">游戏入口</a>");
  });
});
