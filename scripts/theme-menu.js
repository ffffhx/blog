hexo.extend.filter.register("before_generate", function () {
  const themeConfig = this.theme?.config;

  if (!themeConfig || typeof themeConfig !== "object") {
    return;
  }

  const menu = themeConfig.menu;

  if (menu && typeof menu === "object" && "首页" in menu) {
    delete menu.Home;
  }

  if (menu && typeof menu === "object" && "归档" in menu) {
    delete menu.Archives;
  }

  // Hexo merges theme widget arrays instead of replacing them, so enforce
  // the sidebar composition explicitly during generation.
  themeConfig.widgets = ["category"];
});
