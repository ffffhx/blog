import React from "react";

import { ArticleImageLightbox } from "@/components/article-image-lightbox";
import { ArticleQuizEnhancer } from "@/components/article-quiz-enhancer";
import { BenchHeatmapTooltip } from "@/components/bench-heatmap-tooltip";
import { BenchReveal } from "@/components/bench-reveal";
import { RequestGatesLab } from "@/components/request-gates-lab";
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
      <ArticleQuizEnhancer articleContentId={articleContentId} />
      <BenchHeatmapTooltip articleContentId={articleContentId} />
      <BenchReveal articleContentId={articleContentId} />
      <RequestGatesLab articleContentId={articleContentId} />
      <ArticleImageLightbox articleContentId={articleContentId} />
    </>
  );
}
