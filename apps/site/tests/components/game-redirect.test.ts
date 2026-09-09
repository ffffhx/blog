import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GameRedirect, gameRedirectUrl } from "../../components/game-redirect";

describe("legacy game redirects", () => {
  it.each(["farm-life", "forest-shuffle", "texas-holdem"])(
    "redirects %s with invitation parameters and a no-JavaScript fallback",
    (slug) => {
      const markup = renderToStaticMarkup(createElement(GameRedirect, { slug }));
      const destination = gameRedirectUrl(
        `https://ffffhx.github.io/games/${slug}/`,
        "https://ffffhx.github.io/garden-lab/forest-shuffle/?room=abc&seat=1&garden_token=private#table",
      );
      expect(destination).toBe(`https://ffffhx.github.io/games/${slug}/?room=abc&seat=1#table`);
      expect(markup).toContain(`<noscript><meta http-equiv="refresh" content="0;url=https://ffffhx.github.io/games/${slug}/"/></noscript>`);
      expect(markup).toContain(`href="https://ffffhx.github.io/games/${slug}/"`);
    },
  );

  it("supports a configured game site and links without invitation parameters", () => {
    expect(gameRedirectUrl("http://127.0.0.1:5173/games/farm-life/", "http://localhost:3000/farm-life-mvp/"))
      .toBe("http://127.0.0.1:5173/games/farm-life/");
  });
});
