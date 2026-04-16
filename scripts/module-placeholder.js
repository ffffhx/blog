function joinPath(root, segments) {
  return [root.replace(/\/+$/, ""), ...segments.map(function (segment) {
    return String(segment || "").replace(/^\/+|\/+$/g, "");
  })]
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/^([^/])/, "/$1") + "/";
}

hexo.extend.generator.register("module_placeholder", function (locals) {
  const categoryName = "健身";
  const existingCategory = locals.categories.findOne({ name: categoryName });

  if (existingCategory && existingCategory.length) {
    return [];
  }

  const categoryDir = hexo.config.category_dir || "categories";
  const pagePath = `${categoryDir}/${categoryName}/index.html`;
  const techPath = joinPath(hexo.config.root || "/", [categoryDir, "技术"]);
  const permalink = `${String(hexo.config.url || "").replace(/\/+$/, "")}${joinPath("/", [categoryDir, categoryName])}`;

  return [
    {
      path: pagePath,
      data: {
        title: categoryName,
        layout: "page",
        slug: "fitness",
        path: pagePath,
        permalink: permalink,
        date: new Date(),
        updated: new Date(),
        comments: false,
        content: [
          "<p>健身模块已经预留好了，后面的训练记录、动作笔记、饮食复盘和阶段总结都会放在这里。</p>",
          `<p>当前站内已有文章暂时都归在 <a href="${techPath}">技术</a> 模块。</p>`,
        ].join("\n"),
      },
      layout: ["page"],
    },
  ];
});
