hexo.extend.filter.register("before_generate", function () {
  const menu = this.theme?.config?.menu;

  if (!menu || typeof menu !== "object") {
    return;
  }

  if ("首页" in menu) {
    delete menu.Home;
  }

  if ("归档" in menu) {
    delete menu.Archives;
  }
});
