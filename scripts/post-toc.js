const tocHelper = require("hexo/dist/plugins/helper/toc");

const HEADING_SELECTOR = /<h([2-4])\b[^>]*\sid="[^"]+"/g;
const MIN_HEADING_COUNT = 3;

function hasEnoughHeadings(content) {
  return (content.match(HEADING_SELECTOR) || []).length >= MIN_HEADING_COUNT;
}

function isPostPage(page) {
  return page && page.layout === "post" && typeof page.content === "string";
}

function buildToc(content) {
  if (!hasEnoughHeadings(content)) {
    return "";
  }

  return tocHelper(content, {
    min_depth: 2,
    max_depth: 4,
    max_items: 80,
    class: "post-toc-list",
    class_item: "post-toc-item",
    class_link: "post-toc-link",
    class_text: "post-toc-text",
    class_child: "post-toc-child",
    class_level: "post-toc-level",
    list_number: false,
  });
}

function addBodyClass(html, className) {
  return html.replace(/<body([^>]*)>/, (match, attrs) => {
    if (/\bclass=/.test(attrs)) {
      return match.replace(
        /\bclass=(["'])(.*?)\1/,
        (_classMatch, quote, value) => `class=${quote}${value} ${className}${quote}`
      );
    }

    return `<body${attrs} class="${className}">`;
  });
}

hexo.extend.injector.register(
  "head_end",
  () => `<link rel="stylesheet" href="${hexo.config.root}css/post-toc.css">`,
  "post"
);

hexo.extend.injector.register(
  "body_end",
  () => `<script defer src="${hexo.config.root}js/post-toc.js"></script>`,
  "post"
);

hexo.extend.filter.register("after_post_render", function (data) {
  if (!isPostPage(data)) {
    data.post_toc = "";
    return data;
  }

  data.post_toc = buildToc(data.content);

  return data;
});

hexo.extend.filter.register("after_render:html", function (html, locals) {
  const page = locals && locals.page;
  const toc = isPostPage(page) ? buildToc(page.content) : "";

  if (!toc) {
    return html;
  }

  const hasSidebar = html.includes('id="sidebar"');
  const tocMarkup = [
    '<aside id="post-toc-sidebar" class="post-toc-sidebar" aria-label="文章目录">',
    '  <div class="widget-wrap post-toc-wrap">',
    '    <h3 class="widget-title">目录</h3>',
    '    <div class="widget post-toc-card">',
    `      <nav class="post-toc-nav">${toc}</nav>`,
    "    </div>",
    "  </div>",
    "</aside>",
  ].join("");

  let result = addBodyClass(html, "page-with-post-toc");

  result = result.replace(
    '<div class="outer">',
    `<div class="outer outer--with-post-toc${hasSidebar ? " outer--with-right-sidebar" : ""}">`
  );

  result = result.replace('<section id="main">', `${tocMarkup}<section id="main">`);

  return result;
});
