(function () {
  if (window.marked && typeof window.marked.setOptions === "function") {
    window.marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }

  const state = createInitialState("original");
  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("file-input"),
    newOriginalButton: document.getElementById("new-original-button"),
    newCollectionButton: document.getElementById("new-collection-button"),
    importMeta: document.getElementById("import-meta"),
    titleInput: document.getElementById("title-input"),
    typeInput: document.getElementById("type-input"),
    dateInput: document.getElementById("date-input"),
    filenameInput: document.getElementById("filename-input"),
    tagsInput: document.getElementById("tags-input"),
    excerptInput: document.getElementById("excerpt-input"),
    sourceUrlField: document.getElementById("source-url-field"),
    sourceUrlInput: document.getElementById("source-url-input"),
    extraFrontMatterInput: document.getElementById("extra-front-matter-input"),
    bodyInput: document.getElementById("body-input"),
    previewOutput: document.getElementById("preview-output"),
    previewType: document.getElementById("preview-type"),
    previewDate: document.getElementById("preview-date"),
    previewTitle: document.getElementById("preview-title"),
    previewExcerpt: document.getElementById("preview-excerpt"),
    previewBody: document.getElementById("preview-body"),
    destinationPath: document.getElementById("destination-path"),
    writingMode: document.getElementById("writing-mode"),
    wordCount: document.getElementById("word-count"),
    readingTime: document.getElementById("reading-time"),
    statusBox: document.getElementById("status-box"),
    saveButton: document.getElementById("save-button"),
    downloadButton: document.getElementById("download-button"),
    copyButton: document.getElementById("copy-button"),
    toolbarButtons: Array.from(document.querySelectorAll(".toolbar-button")),
  };

  bindEvents();
  syncInputsFromState();
  refreshView();
  renderImportMeta();

  function createInitialState(type) {
    return {
      importedFileName: "",
      title: "",
      type: type || "original",
      date: formatDate(new Date()),
      filename: "new-post",
      tags: "",
      excerpt: "",
      sourceUrl: "",
      extraFrontMatter: "",
      body: "",
    };
  }

  function bindEvents() {
    elements.fileInput.addEventListener("change", onFileChange);
    elements.newOriginalButton.addEventListener("click", function () {
      startBlankArticle("original");
    });
    elements.newCollectionButton.addEventListener("click", function () {
      startBlankArticle("collection");
    });

    ["dragenter", "dragover"].forEach(function (eventName) {
      elements.dropzone.addEventListener(eventName, onDragEnter);
    });

    ["dragleave", "dragend", "drop"].forEach(function (eventName) {
      elements.dropzone.addEventListener(eventName, onDragLeave);
    });

    elements.dropzone.addEventListener("drop", onDrop);

    elements.titleInput.addEventListener("input", function () {
      state.title = elements.titleInput.value.trim();
      if (!elements.filenameInput.dataset.touched) {
        state.filename = sanitizeFileStem(state.title) || "new-post";
        elements.filenameInput.value = state.filename;
      }
      refreshView();
    });

    elements.typeInput.addEventListener("change", function () {
      state.type = elements.typeInput.value;
      refreshView();
    });

    elements.dateInput.addEventListener("input", function () {
      state.date = normalizeDate(elements.dateInput.value);
      refreshView();
    });

    elements.filenameInput.addEventListener("input", function () {
      elements.filenameInput.dataset.touched = "true";
      state.filename = sanitizeFileStem(elements.filenameInput.value) || "new-post";
      elements.filenameInput.value = state.filename;
      refreshView();
    });

    elements.tagsInput.addEventListener("input", function () {
      state.tags = elements.tagsInput.value;
      refreshView();
    });

    elements.excerptInput.addEventListener("input", function () {
      state.excerpt = elements.excerptInput.value.trim();
      refreshView();
    });

    elements.sourceUrlInput.addEventListener("input", function () {
      state.sourceUrl = elements.sourceUrlInput.value.trim();
      refreshView();
    });

    elements.extraFrontMatterInput.addEventListener("input", function () {
      state.extraFrontMatter = elements.extraFrontMatterInput.value.trim();
      refreshView();
    });

    elements.bodyInput.addEventListener("input", function () {
      state.body = elements.bodyInput.value.replace(/\r\n/g, "\n");
      refreshView();
    });

    elements.toolbarButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        insertSnippet(button.dataset.insert || "");
      });
    });

    elements.downloadButton.addEventListener("click", downloadMarkdown);
    elements.copyButton.addEventListener("click", copyMarkdown);
    elements.saveButton.addEventListener("click", saveToBlogRepo);
  }

  function syncInputsFromState() {
    elements.titleInput.value = state.title;
    elements.typeInput.value = state.type;
    elements.dateInput.value = state.date;
    elements.filenameInput.value = state.filename;
    elements.tagsInput.value = state.tags;
    elements.excerptInput.value = state.excerpt;
    elements.sourceUrlInput.value = state.sourceUrl;
    elements.extraFrontMatterInput.value = state.extraFrontMatter;
    elements.bodyInput.value = state.body;
  }

  function onFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      importMarkdownFile(file);
    }
  }

  function onDragEnter(event) {
    event.preventDefault();
    elements.dropzone.classList.add("is-active");
  }

  function onDragLeave(event) {
    event.preventDefault();
    elements.dropzone.classList.remove("is-active");
  }

  function onDrop(event) {
    event.preventDefault();
    elements.dropzone.classList.remove("is-active");
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) {
      importMarkdownFile(file);
    }
  }

  function startBlankArticle(type) {
    const nextState = createInitialState(type);
    nextState.body = buildBodyTemplate(nextState.type);
    Object.assign(state, nextState);
    delete elements.filenameInput.dataset.touched;
    syncInputsFromState();
      refreshView();
      renderImportMeta();
      elements.bodyInput.focus();
      placeCursorAtEnd(elements.bodyInput);
      setStatus("已切换到手写模式。可以直接在正文区写文章，预览会实时更新。", "success");
  }

  async function importMarkdownFile(file) {
    if (!/\.md|\.markdown$/i.test(file.name)) {
      setStatus("只支持导入 .md 或 .markdown 文件。", "error");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseMarkdown(text, file.name);

      state.importedFileName = file.name;
      state.title = parsed.title;
      state.type = parsed.type;
      state.date = parsed.date;
      state.filename = parsed.filename;
      state.tags = parsed.tags.join(", ");
      state.excerpt = parsed.excerpt;
      state.sourceUrl = parsed.sourceUrl;
      state.extraFrontMatter = parsed.extraFrontMatter;
      state.body = parsed.body;

      delete elements.filenameInput.dataset.touched;
      syncInputsFromState();
      refreshView();
      renderImportMeta(parsed);
      setStatus("Markdown 已导入，右侧会实时显示渲染预览。", "success");
    } catch (error) {
      setStatus("导入失败：" + error.message, "error");
    }
  }

  function parseMarkdown(text, fileName) {
    const normalized = text.replace(/\r\n/g, "\n");
    const frontMatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
    const rawFrontMatter = frontMatterMatch ? frontMatterMatch[1] : "";
    const body = (frontMatterMatch ? normalized.slice(frontMatterMatch[0].length) : normalized).replace(/^\n+/, "");
    const parsed = parseFrontMatter(rawFrontMatter);
    const fallbackTitle = stripExtension(fileName);
    const title = parsed.title || fallbackTitle || "未命名文章";
    const type = inferType(parsed);
    const date = normalizeDate(parsed.date || formatDate(new Date()));
    const filename = sanitizeFileStem(stripExtension(fileName) || title || "new-post");

    return {
      title: title,
      type: type,
      date: date,
      filename: filename,
      tags: parsed.tags,
      excerpt: parsed.excerpt,
      sourceUrl: parsed.sourceUrl,
      extraFrontMatter: parsed.extraFrontMatter,
      body: body || "",
    };
  }

  function parseFrontMatter(frontMatter) {
    const result = {
      title: "",
      date: "",
      tags: [],
      categories: [],
      excerpt: "",
      sourceUrl: "",
      extraFrontMatter: "",
    };

    if (!frontMatter.trim()) {
      return result;
    }

    const lines = frontMatter.split("\n");
    const extraLines = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      if (!line.trim()) {
        continue;
      }

      const listLineMatch = line.match(/^([A-Za-z_][\w-]*):\s*$/);
      const scalarLineMatch = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);

      if (listLineMatch) {
        const key = listLineMatch[1];
        const values = [];
        let nextIndex = index + 1;

        while (nextIndex < lines.length) {
          const itemLine = lines[nextIndex];
          const itemMatch = itemLine.match(/^\s*-\s+(.*)$/);

          if (!itemMatch) {
            break;
          }

          values.push(unquote(itemMatch[1].trim()));
          nextIndex += 1;
        }

        if (key === "tags") {
          result.tags = values.filter(Boolean);
        } else if (key === "categories") {
          result.categories = values.filter(Boolean);
        } else {
          extraLines.push(line);
          values.forEach(function (value) {
            extraLines.push("  - " + value);
          });
        }

        index = nextIndex - 1;
        continue;
      }

      if (scalarLineMatch) {
        const key = scalarLineMatch[1];
        const value = unquote(scalarLineMatch[2].trim());

        if (key === "title") {
          result.title = value;
        } else if (key === "date") {
          result.date = value;
        } else if (key === "excerpt") {
          result.excerpt = value;
        } else if (key === "source_url") {
          result.sourceUrl = value;
        } else if (key === "tags") {
          result.tags = parseInlineList(value);
        } else if (key === "categories") {
          result.categories = parseInlineList(value);
        } else {
          extraLines.push(line);
        }

        continue;
      }

      extraLines.push(line);
    }

    result.extraFrontMatter = extraLines.join("\n").trim();
    return result;
  }

  function inferType(parsed) {
    if (parsed.categories.indexOf("收藏") >= 0 || parsed.sourceUrl) {
      return "collection";
    }

    return "original";
  }

  function parseInlineList(value) {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    const bracketMatch = trimmed.match(/^\[(.*)\]$/);
    const listValue = bracketMatch ? bracketMatch[1] : trimmed;

    return listValue
      .split(",")
      .map(function (item) {
        return unquote(item.trim());
      })
      .filter(Boolean);
  }

  function refreshView() {
    toggleSourceUrlField();
    renderImportMeta();
    updateWritingMeta();
    renderPreview();
    elements.previewOutput.value = buildMarkdown();
    elements.destinationPath.textContent = buildDestinationPath();
  }

  function toggleSourceUrlField() {
    elements.sourceUrlField.style.display = state.type === "collection" ? "grid" : "none";
  }

  function renderImportMeta(parsed) {
    if (state.importedFileName) {
      const activeType = (parsed && parsed.type) || state.type;
      elements.importMeta.innerHTML =
        "<strong>已导入：</strong>" +
        escapeHtml(state.importedFileName) +
        "<br><strong>当前标题：</strong>" +
        escapeHtml(state.title || "未命名文章") +
        "<br><strong>当前类型：</strong>" +
        escapeHtml(activeType === "collection" ? "收藏" : "原创") +
        "<br><strong>当前日期：</strong>" +
        escapeHtml(state.date);
      return;
    }

    elements.importMeta.innerHTML =
      "<strong>手写模式：</strong> 你可以不导入文件，直接填写标题和正文。<br><strong>建议：</strong> 点击“新建原创文章”或“新建收藏文章”后开始写，右侧会实时预览最终效果。";
  }

  function updateWritingMeta() {
    const plainText = stripMarkdown(state.body);
    const characterCount = plainText.replace(/\s+/g, "").length;
    const readingMinutes = Math.max(1, Math.ceil(characterCount / 400));

    elements.writingMode.textContent = state.importedFileName ? "当前模式：导入后编辑" : "当前模式：直接手写";
    elements.wordCount.textContent = "正文长度：" + characterCount + " 字";
    elements.readingTime.textContent = "预计阅读：" + readingMinutes + " 分钟";
  }

  function renderPreview() {
    elements.previewType.textContent = state.type === "collection" ? "收藏" : "原创";
    elements.previewDate.textContent = state.date || "--";
    elements.previewTitle.textContent = state.title || "未命名文章";
    elements.previewExcerpt.textContent = state.excerpt || "这里会显示摘要预览；如果没有填写摘要，会用一段默认提示占位。";

    if (!(state.body || "").trim()) {
      elements.previewBody.innerHTML = '<p class="preview-empty">开始输入正文后，这里会显示渲染后的 Markdown 预览。</p>';
      return;
    }

    elements.previewBody.innerHTML = renderMarkdown(state.body);
    elements.previewBody.querySelectorAll("a").forEach(function (link) {
      link.target = "_blank";
      link.rel = "noreferrer noopener";
    });
  }

  function renderMarkdown(markdown) {
    const safeMarkdown = markdown || "";

    if (window.marked && typeof window.marked.parse === "function") {
      const rendered = window.marked.parse(safeMarkdown);
      if (window.DOMPurify && typeof window.DOMPurify.sanitize === "function") {
        return window.DOMPurify.sanitize(rendered);
      }
      return rendered;
    }

    return "<pre>" + escapeHtml(safeMarkdown) + "</pre>";
  }

  function buildDestinationPath() {
    const parts = getDateParts(state.date);
    return "source/_posts/" + parts.year + "/" + parts.month + "/" + parts.day + "/" + ensureMarkdownExtension(state.filename);
  }

  function buildMarkdown() {
    const lines = [
      "---",
      "title: " + quoteYaml(state.title || "未命名文章"),
      "date: " + normalizeDate(state.date || formatDate(new Date())),
      "categories:",
      "  - " + quoteYaml(state.type === "collection" ? "收藏" : "原创"),
      "tags:",
    ];

    parseTags(state.tags).forEach(function (tag) {
      lines.push("  - " + quoteYaml(tag));
    });

    if (state.excerpt) {
      lines.push("excerpt: " + quoteYaml(state.excerpt));
    } else {
      lines.push("excerpt:");
    }

    if (state.type === "collection" && state.sourceUrl) {
      lines.push("source_url: " + quoteYaml(state.sourceUrl));
    }

    if (state.extraFrontMatter) {
      lines.push(state.extraFrontMatter.trim());
    }

    lines.push("---");
    lines.push("");
    lines.push((state.body || "").replace(/^\n+/, ""));

    return lines.join("\n").replace(/\n+$/, "\n");
  }

  function parseTags(tagsText) {
    return String(tagsText || "")
      .split(",")
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);
  }

  function insertSnippet(kind) {
    const textarea = elements.bodyInput;
    const selectionStart = textarea.selectionStart || 0;
    const selectionEnd = textarea.selectionEnd || 0;
    const selectedText = textarea.value.slice(selectionStart, selectionEnd);
    let snippet = "";

    if (kind === "h2") {
      snippet = "## " + (selectedText || "小节标题") + "\n\n";
    } else if (kind === "h3") {
      snippet = "### " + (selectedText || "补充小节") + "\n\n";
    } else if (kind === "quote") {
      snippet = selectedText
        ? selectedText.split("\n").map(function (line) { return "> " + line; }).join("\n") + "\n\n"
        : "> 引用内容\n\n";
    } else if (kind === "list") {
      snippet = selectedText
        ? selectedText.split("\n").map(function (line) { return "- " + line; }).join("\n") + "\n\n"
        : "- 条目 1\n- 条目 2\n\n";
    } else if (kind === "code") {
      snippet = "```text\n" + selectedText + "\n```\n\n";
    } else if (kind === "link") {
      snippet = "[" + (selectedText || "链接标题") + "](https://example.com)\n";
    }

    if (!snippet) {
      return;
    }

    snippet = normalizeSnippetPlacement(textarea.value, selectionStart, selectionEnd, snippet);

    const nextValue = textarea.value.slice(0, selectionStart) + snippet + textarea.value.slice(selectionEnd);
    textarea.value = nextValue;
    state.body = nextValue.replace(/\r\n/g, "\n");
    refreshView();

    const nextCursor = selectionStart + snippet.length;
    textarea.focus();
    textarea.setSelectionRange(nextCursor, nextCursor);
  }

  function buildBodyTemplate(type) {
    if (type === "collection") {
      return [
        "## 原文链接",
        "",
        "[原文标题](https://example.com/article)",
        "",
        "## 为什么收藏",
        "",
        "简单写下你为什么想保留这篇内容。",
        "",
        "## 我的摘录",
        "",
        "- ",
        "",
        "## 读后备注",
        "",
        "补充自己的理解、反思或后续行动。",
      ].join("\n");
    }

    return [
      "## 写在前面",
      "",
      "一句话说明这篇文章想解决什么问题。",
      "",
      "## 正文",
      "",
      "从这里开始写作。",
      "",
      "## 结尾",
      "",
      "补充总结、参考资料或下一步计划。",
    ].join("\n");
  }

  function normalizeSnippetPlacement(value, start, end, snippet) {
    const previousChar = value.slice(Math.max(0, start - 1), start);
    const nextChar = value.slice(end, end + 1);
    let prefix = "";
    let suffix = "";

    if (start > 0 && previousChar !== "\n") {
      prefix = "\n\n";
    } else if (start > 1 && value.slice(Math.max(0, start - 2), start) !== "\n\n") {
      prefix = "\n";
    }

    if (nextChar && nextChar !== "\n") {
      suffix = "\n\n";
    }

    return prefix + snippet + suffix;
  }

  function stripMarkdown(value) {
    return String(value || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/[*_~>-]/g, " ");
  }

  function setStatus(message, type) {
    elements.statusBox.innerHTML = message;
    elements.statusBox.classList.remove("is-success", "is-error");

    if (type === "success") {
      elements.statusBox.classList.add("is-success");
    } else if (type === "error") {
      elements.statusBox.classList.add("is-error");
    }
  }

  function downloadMarkdown() {
    const output = buildMarkdown();
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = ensureMarkdownExtension(state.filename);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus("已下载 Markdown 文件。", "success");
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      setStatus("已复制生成后的 Markdown 内容。", "success");
    } catch (error) {
      setStatus("复制失败，请改用下载 Markdown。", "error");
    }
  }

  async function saveToBlogRepo() {
    if (!window.showDirectoryPicker) {
      setStatus("当前浏览器不支持直接写入本地目录，请改用“下载 Markdown”。推荐使用 Chrome 或 Edge。", "error");
      return;
    }

    try {
      const rootHandle = await window.showDirectoryPicker({
        id: "hexo-blog-root",
        mode: "readwrite",
      });

      await rootHandle.getFileHandle("_config.yml");

      const sourceHandle = await rootHandle.getDirectoryHandle("source");
      const postsHandle = await sourceHandle.getDirectoryHandle("_posts");
      const parts = getDateParts(state.date);
      const yearHandle = await postsHandle.getDirectoryHandle(parts.year, { create: true });
      const monthHandle = await yearHandle.getDirectoryHandle(parts.month, { create: true });
      const dayHandle = await monthHandle.getDirectoryHandle(parts.day, { create: true });
      const fileHandle = await dayHandle.getFileHandle(ensureMarkdownExtension(state.filename), {
        create: true,
      });
      const writable = await fileHandle.createWritable();

      await writable.write(buildMarkdown());
      await writable.close();

      setStatus(
        "已保存到本地仓库：<code>" + escapeHtml(buildDestinationPath()) + "</code><br>接下来执行 git 提交并 push，就会自动发布。",
        "success"
      );
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("已取消保存。", "error");
        return;
      }

      if (error && error.name === "NotFoundError") {
        setStatus("你选择的目录看起来不是博客仓库根目录。请选择包含 <code>_config.yml</code> 的目录。", "error");
        return;
      }

      setStatus("保存失败：" + error.message, "error");
    }
  }

  function normalizeDate(value) {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      return formatDate(new Date());
    }

    const normalized = trimmed.replace("T", " ");
    const date = new Date(normalized);

    if (!Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(normalized)) {
      return formatDate(date);
    }

    return trimmed;
  }

  function formatDate(date) {
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join("-") + " " + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(":");
  }

  function getDateParts(dateText) {
    const match = normalizeDate(dateText).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: match[1],
        month: match[2],
        day: match[3],
      };
    }

    const now = new Date();
    return {
      year: String(now.getFullYear()),
      month: pad(now.getMonth() + 1),
      day: pad(now.getDate()),
    };
  }

  function stripExtension(fileName) {
    return String(fileName || "").replace(/\.(md|markdown)$/i, "");
  }

  function sanitizeFileStem(value) {
    const trimmed = String(value || "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return trimmed || "";
  }

  function ensureMarkdownExtension(fileName) {
    return /\.md$/i.test(fileName) ? fileName : fileName + ".md";
  }

  function quoteYaml(value) {
    return "\"" + String(value || "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
  }

  function unquote(value) {
    return String(value || "").replace(/^['"]|['"]$/g, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function placeCursorAtEnd(textarea) {
    const length = textarea.value.length;
    textarea.setSelectionRange(length, length);
  }
})();
