// @vitest-environment jsdom
import { expect, it } from "vitest";
import { detectArticleEnhancements } from "../../components/article-enhancements";

it("does not activate specialist modules for ordinary prose or escaped code examples", () => {
  const article = document.createElement("article");
  article.innerHTML = '<h2>Text</h2><p>Body</p><pre>&lt;div class="request-gates-html"&gt;</pre>';
  expect(Object.values(detectArticleEnhancements(article)).some(Boolean)).toBe(false);
});

it("activates only the features declared by real article elements", () => {
  const article = document.createElement("article");
  article.innerHTML = '<div class="request-gates-html"></div><img src="cover.png">';
  expect(detectArticleEnhancements(article)).toEqual({ quiz: false, heatmap: false, reveal: false, gates: true, lightbox: true });
  article.innerHTML = '<div class="benchviz"><span class="bv-c" data-tip="Result"></span></div><h4>Question</h4><details>Answer</details>';
  expect(detectArticleEnhancements(article)).toEqual({ quiz: true, heatmap: true, reveal: true, gates: false, lightbox: false });
});
