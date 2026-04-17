function stripDisabledModuleLinks(html) {
  if (typeof html !== "string") {
    return html;
  }

  return html
    .replace(
      /\s*<a class="main-nav-link" href="[^"]*\/(?:archives|publish)\/?">[^<]*<\/a>/g,
      ""
    )
    .replace(
      /\s*<a href="[^"]*\/(?:archives|publish)\/?" class="mobile-nav-link">[^<]*<\/a>/g,
      ""
    )
    .replace(
      /<a href="[^"]*\/archives\/\d+(?:\/\d+)?\/?" class="archive-year">([^<]+)<\/a>/g,
      '<span class="archive-year">$1</span>'
    );
}

hexo.extend.filter.register("after_render:html", stripDisabledModuleLinks);
