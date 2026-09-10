"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Quiz = dynamic(() => import("./article-quiz-enhancer").then((m) => m.ArticleQuizEnhancer), { ssr: false });
const Heatmap = dynamic(() => import("./bench-heatmap-tooltip").then((m) => m.BenchHeatmapTooltip), { ssr: false });
const Reveal = dynamic(() => import("./bench-reveal").then((m) => m.BenchReveal), { ssr: false });
const Gates = dynamic(() => import("./request-gates-lab").then((m) => m.RequestGatesLab), { ssr: false });
const Lightbox = dynamic(() => import("./article-image-lightbox").then((m) => m.ArticleImageLightbox), { ssr: false });

export function detectArticleEnhancements(container: HTMLElement) {
  return {
    quiz: Boolean(container.querySelector("h4") && container.querySelector("details")),
    heatmap: Boolean(container.querySelector(".bv-c[data-tip]")),
    reveal: Boolean(container.querySelector(".capformula, .pickflow, .benchviz, .bench-layers, .bench-planes, .bench-pos, [data-reveal]")),
    gates: Boolean(container.querySelector(".request-gates-html")),
    lightbox: Boolean(container.querySelector("img")),
  };
}

// Authored markup opts in. Unrelated articles do not load the feature modules.
export function ArticleEnhancements({ articleContentId }: { articleContentId: string }) {
  const [features, setFeatures] = useState<ReturnType<typeof detectArticleEnhancements> | null>(null);
  useEffect(() => {
    const container = document.getElementById(articleContentId);
    setFeatures(container ? detectArticleEnhancements(container) : null);
  }, [articleContentId]);
  if (!features) return null;
  const props = { articleContentId };
  return <>
    {features.quiz ? <Quiz {...props} /> : null}
    {features.heatmap ? <Heatmap {...props} /> : null}
    {features.reveal ? <Reveal {...props} /> : null}
    {features.gates ? <Gates {...props} /> : null}
    {features.lightbox ? <Lightbox {...props} /> : null}
  </>;
}
