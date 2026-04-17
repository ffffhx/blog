import { describe, expect, it } from "vitest";

import { getAllPosts, getPostBySlug } from "../../lib/content/posts";

describe("getAllPosts", () => {
  it("loads and sorts posts by date descending", () => {
    const posts = getAllPosts();

    expect(posts.length).toBeGreaterThan(1);
    expect(posts[0].date.getTime()).toBeGreaterThanOrEqual(posts[1].date.getTime());
  });
});

describe("getPostBySlug", () => {
  it("returns a known post body by slug", () => {
    const firstPost = getAllPosts()[0];
    const post = getPostBySlug(firstPost.slug);

    expect(post).not.toBeNull();
    expect(post?.title.length).toBeGreaterThan(0);
    expect(post?.contentHtml.length).toBeGreaterThan(0);
  });
});
