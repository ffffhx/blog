hexo.extend.filter.register("before_generate", function () {
  const themeConfig = this.theme?.config;
  const siteThemeConfig = this.config?.theme_config;

  if (!themeConfig || typeof themeConfig !== "object") {
    return;
  }

  // Hexo deep-merges theme config, so theme defaults like "Home" and
  // "Archives" remain unless we replace the menu object explicitly.
  themeConfig.menu =
    siteThemeConfig?.menu && typeof siteThemeConfig.menu === "object"
      ? { ...siteThemeConfig.menu }
      : {};

  // Hexo merges theme widget arrays instead of replacing them, so enforce
  // the sidebar composition explicitly during generation.
  themeConfig.widgets = Array.isArray(siteThemeConfig?.widgets)
    ? [...siteThemeConfig.widgets]
    : ["category"];
});
