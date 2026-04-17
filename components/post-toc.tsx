"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { Heading } from "@/lib/content/types";

type PostTocProps = {
  headings: Heading[];
};

export function PostToc({ headings }: PostTocProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);

  useEffect(() => {
    if (headingIds.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 1],
      }
    );

    for (const id of headingIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [headingIds]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-5 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.55)] xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:overscroll-contain">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 xl:sticky xl:top-0 xl:bg-white/95 xl:pb-3 xl:backdrop-blur">
        目录
      </p>
      <nav aria-label="文章目录" className="space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "block rounded-xl px-3 py-2 text-sm leading-6 text-slate-600 transition hover:bg-amber-50 hover:text-amber-900",
              heading.depth === 3 && "ml-3",
              heading.depth === 4 && "ml-6",
              activeId === heading.id &&
                "bg-amber-100 text-slate-950 ring-1 ring-amber-200 hover:bg-amber-100 hover:text-slate-950"
            )}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
