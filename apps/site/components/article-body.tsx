import React from "react";

import { ArticleEnhancements } from "@/components/article-enhancements";
import type { ContentImageSize } from "@/lib/content/types";

type ArticleBodyProps = {
  contentImageSize?: ContentImageSize;
  html: string;
  slug: string;
};

function toArticleContentId(slug: string) {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "");

  return `article-content-${safeSlug || "post"}`;
}

export function ArticleBody({
  contentImageSize = "default",
  html,
  slug,
}: ArticleBodyProps) {
  const articleContentId = toArticleContentId(slug);

  return (
    <>
      <div
        className="article-content"
        data-content-image-size={contentImageSize}
        dangerouslySetInnerHTML={{ __html: html }}
        id={articleContentId}
      />
      <ArticleEnhancements key={contentRevision(html)} articleContentId={articleContentId} />
    </>
  );
}

// Remount DOM enhancements when a body changes without changing its slug.
function contentRevision(html: string) {
  let hash = 2166136261;
  for (let i = 0; i < html.length; i++) hash = Math.imul(hash ^ html.charCodeAt(i), 16777619);
  return hash >>> 0;
}
