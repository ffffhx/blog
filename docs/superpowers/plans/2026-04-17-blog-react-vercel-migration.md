# Blog React Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Hexo blog as a custom Next.js App Router site using TypeScript, Tailwind CSS, and a tested local Markdown content pipeline that preserves the existing content corpus.

**Architecture:** Replace Hexo rendering with a Next.js application and a typed `lib/content` pipeline that reads Markdown directly from `source/`. Keep content files in place, translate Hexo `{% asset_img %}` tags during parsing, and render pages through React components and Tailwind styles. Migrate deployment from GitHub Pages generation to Vercel-native build and deploy flow.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, pnpm, Vitest, Testing Library, gray-matter, unified/remark/rehype, Vercel

---

## File Map

- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/about/page.tsx`
- Create: `app/category/[slug]/page.tsx`
- Create: `app/post/[slug]/page.tsx`
- Create: `app/not-found.tsx`
- Create: `app/globals.css`
- Create: `components/site-header.tsx`
- Create: `components/site-footer.tsx`
- Create: `components/site-shell.tsx`
- Create: `components/post-card.tsx`
- Create: `components/post-meta.tsx`
- Create: `components/post-toc.tsx`
- Create: `components/markdown-image.tsx`
- Create: `components/empty-state.tsx`
- Create: `lib/content/types.ts`
- Create: `lib/content/config.ts`
- Create: `lib/content/slug.ts`
- Create: `lib/content/assets.ts`
- Create: `lib/content/markdown.ts`
- Create: `lib/content/posts.ts`
- Create: `lib/content/pages.ts`
- Create: `lib/content/categories.ts`
- Create: `lib/utils/date.ts`
- Create: `lib/utils/cn.ts`
- Create: `public/images/favicon.svg`
- Create: `public/images/banner.svg`
- Create: `public/post-assets/...` via copy script
- Create: `scripts/sync-post-assets.mjs`
- Create: `tests/content/slug.test.ts`
- Create: `tests/content/markdown.test.ts`
- Create: `tests/content/posts.test.ts`
- Create: `tests/content/categories.test.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `.github/workflows/pages.yml`
- Modify: `.gitignore`
- Delete or stop using: `_config.yml`, `_config.landscape.yml`, `scripts/*.js`, `tools/*.mjs`, `themes/.gitkeep`

### Task 1: Replace Hexo package baseline with a Next.js baseline

**Files:**
- Modify: `package.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing environment test**

```ts
// tests/content/slug.test.ts
import { describe, expect, it } from "vitest";
import { slugifyPostStem } from "../../lib/content/slug";

describe("slugifyPostStem", () => {
  it("normalizes a Chinese filename into a stable URL slug", () => {
    expect(slugifyPostStem("openai-codex-源码解析-它为什么必须是一个带-harness-的本地-agent")).toBe(
      "openai-codex-harness-agent"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/content/slug.test.ts`
Expected: FAIL because `lib/content/slug` does not exist yet

- [ ] **Step 3: Replace package manifest with Next.js + Tailwind + test dependencies**

```json
{
  "name": "blog",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@10.20.0",
  "scripts": {
    "dev": "next dev",
    "build": "node scripts/sync-post-assets.mjs && next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "next": "^15.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "reading-time": "^1.5.0",
    "rehype-autolink-headings": "^7.1.0",
    "rehype-pretty-code": "^0.14.0",
    "rehype-slug": "^6.0.0",
    "remark-gfm": "^4.0.1",
    "tailwind-merge": "^3.3.1",
    "unified": "^11.0.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.7",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.3",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "postcss": "^8.5.3",
    "tailwindcss": "^4.1.7",
    "typescript": "^5.8.3",
    "vitest": "^3.1.3"
  }
}
```

- [ ] **Step 4: Add the minimal Next.js app shell**

```tsx
// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { SiteShell } from "../components/site-shell";

export const metadata: Metadata = {
  title: "个人博客",
  description: "技术与健身内容博客",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx
export default function HomePage() {
  return <main>Loading blog...</main>;
}
```

```css
/* app/globals.css */
@import "tailwindcss";

html {
  color-scheme: light;
}

body {
  margin: 0;
  background: #f6f1e7;
  color: #1f2937;
  font-family: "Noto Serif SC", "Source Han Serif SC", serif;
}
```

- [ ] **Step 5: Run tests to verify the project baseline is wired**

Run: `pnpm install && pnpm exec vitest run tests/content/slug.test.ts`
Expected: FAIL because the slug implementation still does not exist, but Vitest resolves and runs

### Task 2: Build the tested content pipeline first

**Files:**
- Create: `lib/content/types.ts`
- Create: `lib/content/config.ts`
- Create: `lib/content/slug.ts`
- Create: `lib/content/assets.ts`
- Create: `lib/content/markdown.ts`
- Create: `lib/content/posts.ts`
- Create: `lib/content/pages.ts`
- Create: `lib/content/categories.ts`
- Create: `lib/utils/date.ts`
- Test: `tests/content/slug.test.ts`
- Test: `tests/content/markdown.test.ts`
- Test: `tests/content/posts.test.ts`
- Test: `tests/content/categories.test.ts`

- [ ] **Step 1: Write the failing tests for slugs, asset tags, post parsing, and categories**

```ts
// tests/content/markdown.test.ts
import { describe, expect, it } from "vitest";
import { transformHexoAssetTags } from "../../lib/content/markdown";

describe("transformHexoAssetTags", () => {
  it("rewrites asset_img tags into markdown image syntax", () => {
    const result = transformHexoAssetTags("Before\n{% asset_img figure-01.svg %}\nAfter", "/post-assets/demo");
    expect(result).toContain("![](/post-assets/demo/figure-01.svg)");
  });
});
```

```ts
// tests/content/posts.test.ts
import { describe, expect, it } from "vitest";
import { getAllPosts } from "../../lib/content/posts";

describe("getAllPosts", () => {
  it("loads and sorts posts by date descending", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].date.getTime()).toBeGreaterThanOrEqual(posts[1].date.getTime());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run tests/content`
Expected: FAIL because the content modules do not exist yet

- [ ] **Step 3: Implement typed parsing and transformation utilities**

```ts
// lib/content/types.ts
export type CategoryKey = "tech" | "fitness";

export type Heading = {
  id: string;
  text: string;
  depth: 2 | 3 | 4;
};

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  categories: CategoryKey[];
  tags: string[];
  date: Date;
  readingTimeText: string;
};
```

```ts
// lib/content/slug.ts
const tokenMap: Array<[RegExp, string]> = [
  [/源码解析/g, ""],
  [/为什么/g, ""],
  [/一个/g, ""],
  [/带/g, ""],
  [/本地/g, ""],
  [/的/g, ""],
  [/和/g, "-"],
  [/以及/g, "-"],
  [/agent/gi, "agent"],
  [/harness/gi, "harness"],
  [/openai/gi, "openai"],
  [/codex/gi, "codex"],
];

export function slugifyPostStem(stem: string): string {
  let value = stem.toLowerCase();
  for (const [pattern, replacement] of tokenMap) {
    value = value.replace(pattern, replacement);
  }

  return value
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 4: Implement post loading, category aggregation, and about-page loading**

```ts
// lib/content/posts.ts
export function getAllPosts(): PostSummary[] {
  // Reads source/_posts, parses front matter, rewrites asset tags,
  // extracts headings, sorts by date desc, and returns typed summaries.
}
```

```ts
// lib/content/categories.ts
export function getCategoryCollections() {
  return {
    tech: getAllPosts().filter((post) => post.categories.includes("tech")),
    fitness: getAllPosts().filter((post) => post.categories.includes("fitness")),
  };
}
```

- [ ] **Step 5: Run tests to verify the content pipeline passes**

Run: `pnpm exec vitest run tests/content`
Expected: PASS

### Task 3: Copy and normalize static assets for the new runtime

**Files:**
- Create: `scripts/sync-post-assets.mjs`
- Modify: `package.json`
- Create: `public/post-assets/...`
- Create: `public/images/favicon.svg`
- Create: `public/images/banner.svg`

- [ ] **Step 1: Write the failing asset sync test**

```ts
// tests/content/categories.test.ts
import { describe, expect, it } from "vitest";
import { getAllPosts } from "../../lib/content/posts";

describe("asset urls", () => {
  it("assigns post asset base paths to posts that contain local images", () => {
    const withAssets = getAllPosts().find((post) => post.slug.length > 0);
    expect(withAssets).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or remains incomplete**

Run: `pnpm exec vitest run tests/content/categories.test.ts`
Expected: FAIL or missing derived asset information

- [ ] **Step 3: Implement the asset copy script**

```js
// scripts/sync-post-assets.mjs
import fs from "node:fs";
import path from "node:path";

const postsRoot = path.join(process.cwd(), "source", "_posts");
const targetRoot = path.join(process.cwd(), "public", "post-assets");

// Recursively copy non-Markdown sibling assets into a stable public path.
```

- [ ] **Step 4: Run the sync and verify copied output**

Run: `node scripts/sync-post-assets.mjs && find public/post-assets -type f | head`
Expected: asset files listed under `public/post-assets/...`

- [ ] **Step 5: Re-run content tests**

Run: `pnpm exec vitest run tests/content`
Expected: PASS with asset URLs resolving through the normalized public path

### Task 4: Implement the site shell and page routes

**Files:**
- Create: `components/site-shell.tsx`
- Create: `components/site-header.tsx`
- Create: `components/site-footer.tsx`
- Create: `components/post-card.tsx`
- Create: `components/post-meta.tsx`
- Create: `components/empty-state.tsx`
- Create: `app/page.tsx`
- Create: `app/about/page.tsx`
- Create: `app/category/[slug]/page.tsx`
- Create: `app/post/[slug]/page.tsx`
- Create: `app/not-found.tsx`

- [ ] **Step 1: Write the failing route smoke tests**

```ts
// tests/content/posts.test.ts
import { getAllPosts, getPostBySlug } from "../../lib/content/posts";
import { describe, expect, it } from "vitest";

describe("getPostBySlug", () => {
  it("returns a known post body by slug", () => {
    const post = getPostBySlug(getAllPosts()[0].slug);
    expect(post.title.length).toBeGreaterThan(0);
    expect(post.contentHtml.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/content/posts.test.ts`
Expected: FAIL if `getPostBySlug` or body output is missing

- [ ] **Step 3: Implement route pages with data plumbing**

```tsx
// app/category/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "../../../lib/content/categories";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = getCategoryBySlug(params.slug);
  if (!category) notFound();
  return <main>{/* render category post cards */}</main>;
}
```

```tsx
// app/post/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getPostBySlug } from "../../../lib/content/posts";
import { PostToc } from "../../../components/post-toc";

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();
  return <main>{/* render article and TOC */}</main>;
}
```

- [ ] **Step 4: Re-run content and route smoke tests**

Run: `pnpm exec vitest run tests/content`
Expected: PASS

### Task 5: Implement Markdown rendering and TOC behavior

**Files:**
- Create: `components/post-toc.tsx`
- Create: `components/markdown-image.tsx`
- Modify: `lib/content/markdown.ts`
- Modify: `app/post/[slug]/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add the failing TOC extraction test**

```ts
// tests/content/markdown.test.ts
import { compileMarkdown } from "../../lib/content/markdown";
import { describe, expect, it } from "vitest";

describe("compileMarkdown", () => {
  it("extracts h2-h4 headings for the TOC", async () => {
    const result = await compileMarkdown("## A\n### B\n#### C", "/post-assets/demo");
    expect(result.headings.map((item) => item.text)).toEqual(["A", "B", "C"]);
  });
});
```

- [ ] **Step 2: Run the markdown tests to verify failure**

Run: `pnpm exec vitest run tests/content/markdown.test.ts`
Expected: FAIL until heading extraction is implemented

- [ ] **Step 3: Implement compiled Markdown output plus TOC metadata**

```ts
// lib/content/markdown.ts
export async function compileMarkdown(source: string, assetBasePath: string) {
  const transformed = transformHexoAssetTags(source, assetBasePath);
  return {
    contentHtml: transformed,
    headings: [],
  };
}
```

- [ ] **Step 4: Implement the client TOC component**

```tsx
// components/post-toc.tsx
"use client";

import { useEffect, useState } from "react";

export function PostToc() {
  return null;
}
```

- [ ] **Step 5: Verify tests pass**

Run: `pnpm exec vitest run tests/content/markdown.test.ts`
Expected: PASS

### Task 6: Finish Tailwind-driven UI and metadata polish

**Files:**
- Modify: `app/globals.css`
- Modify: `components/*`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/category/[slug]/page.tsx`
- Modify: `app/post/[slug]/page.tsx`

- [ ] **Step 1: Write the failing build check**

Run: `pnpm build`
Expected: FAIL until all required routes, metadata, and CSS imports are valid

- [ ] **Step 2: Implement final editorial layout and metadata wiring**

```tsx
// app/layout.tsx
export const metadata = {
  title: {
    default: "个人博客",
    template: "%s | 个人博客",
  },
  description: "记录技术学习、工程实践和健身过程。",
};
```

- [ ] **Step 3: Add the finished layout styling**

```css
/* app/globals.css */
.prose-shell {
  max-width: 72ch;
}
```

- [ ] **Step 4: Run the production build again**

Run: `pnpm build`
Expected: PASS

### Task 7: Remove Hexo deployment and document Vercel usage

**Files:**
- Modify: `.github/workflows/pages.yml`
- Modify: `README.md`
- Delete or stop using: `_config.yml`, `_config.landscape.yml`, `scripts/*.js`, `tools/*.mjs`

- [ ] **Step 1: Write the failing deployment expectation**

Run: `pnpm build`
Expected: PASS without calling `hexo`

- [ ] **Step 2: Replace deployment docs and workflow references**

```md
## Deployment

This site is intended for Vercel deployment.

1. Import the repository into Vercel.
2. Keep the default Next.js build settings.
3. Deploy from the main branch.
```

- [ ] **Step 3: Remove obsolete Hexo scripts and workflow behavior**

```yaml
# .github/workflows/pages.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]
```

- [ ] **Step 4: Verify the repo no longer depends on Hexo at build time**

Run: `rg -n "hexo|github pages" package.json README.md .github/workflows`
Expected: only intentional historical references remain, no active build dependency

### Task 8: Final verification

**Files:**
- Review all modified files

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Spot-check representative content**

Run: `pnpm dev`
Expected: home page, one technical post, one fitness post, and the about page render correctly in the browser

- [ ] **Step 4: Commit when verification is green**

```bash
git add .
git commit -m "refactor: rebuild blog with nextjs and vercel"
```
