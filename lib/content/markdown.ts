import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import { normalizeAssetUrl } from "@/lib/content/assets";
import type { Heading } from "@/lib/content/types";

const HEXO_ASSET_IMAGE_RE =
  /\{%\s*asset_img\s+([^\s%]+)(?:\s+[^%]*)?%\}/g;

const RELATIVE_MARKDOWN_IMAGE_RE =
  /!\[([^\]]*)\]\((?!https?:\/\/|\/|data:)([^)\s]+)(?:\s+"([^"]*)")?\)/g;

export function transformHexoAssetTags(source: string, assetBasePath: string) {
  let transformed = source.replace(HEXO_ASSET_IMAGE_RE, (_match, assetName) => {
    return `![](${normalizeAssetUrl(assetBasePath, String(assetName))})`;
  });

  transformed = transformed.replace(
    RELATIVE_MARKDOWN_IMAGE_RE,
    (_match, alt, assetName, title) => {
      const titlePart = title ? ` "${title}"` : "";
      return `![${alt}](${normalizeAssetUrl(
        assetBasePath,
        String(assetName)
      )}${titlePart})`;
    }
  );

  return transformed;
}

export function extractHeadings(source: string) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source);
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  visit(tree, "heading", (node) => {
    if (node.depth < 2 || node.depth > 4) {
      return;
    }

    const text = toString(node).trim();
    if (!text) {
      return;
    }

    headings.push({
      id: slugger.slug(text),
      text,
      depth: node.depth as 2 | 3 | 4,
    });
  });

  return headings;
}

export function compileMarkdown(source: string, assetBasePath: string) {
  const content = transformHexoAssetTags(source, assetBasePath);
  const headings = extractHeadings(content);
  const contentHtml = String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeStringify)
      .processSync(content)
  );

  return {
    content,
    contentHtml,
    headings,
  };
}
