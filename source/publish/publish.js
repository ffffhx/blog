(function () {
  const state = {
    importedFileName: "",
    title: "",
    type: "original",
    date: formatDate(new Date()),
    filename: "new-post",
    tags: "",
    excerpt: "",
    sourceUrl: "",
    extraFrontMatter: "",
    body: "",
  };

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("file-input"),
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
    destinationPath: document.getElementById("destination-path"),
    statusBox: document.getElementById("status-box"),
    saveButton: document.getElementById("save-button"),
    downloadButton: document.getElementById("download-button"),
    copyButton: document.getElementById("copy-button"),
  };

  bindEvents();
  refreshView();

  function bindEvents() {
    elements.fileInput.addEventListener("change", onFileChange);
    ["dragenter", "dragover"].forEach((eventName) => {
      elements.dropzone.addEventListener(eventName, onDragEnter);
    });
    ["dragleave", "dragend", "drop"].forEach((eventName) => {
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

    elements.downloadButton.addEventListener("click", downloadMarkdown);
    elements.copyButton.addEventListener("click", copyMarkdown);
    elements.saveButton.addEventListener("click", saveToBlogRepo);
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

      elements.titleInput.value = state.title;
      elements.typeInput.value = state.type;
      elements.dateInput.value = state.date;
      elements.filenameInput.value = state.filename;
      delete elements.filenameInput.dataset.touched;
      elements.tagsInput.value = state.tags;
      elements.excerptInput.value = state.excerpt;
      elements.sourceUrlInput.value = state.sourceUrl;
      elements.extraFrontMatterInput.value = state.extraFrontMatter;
      elements.bodyInput.value = state.body;

      updateImportMeta(parsed);
      refreshView();
      setStatus("Markdown 已导入，你可以继续调整字段后保存。", "success");
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
      hadFrontMatter: Boolean(frontMatterMatch),
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
    const output = buildMarkdown();
    elements.previewOutput.value = output;
    elements.destinationPath.textContent = buildDestinationPath();
  }

  function toggleSourceUrlField() {
    elements.sourceUrlField.style.display = state.type === "collection" ? "grid" : "none";
  }

  function buildDestinationPath() {
    const parts = getDateParts(state.date);
    return "source/_posts/" + parts.year + "/" + parts.month + "/" + parts.day + "/" + ensureMarkdownExtension(state.filename) ;
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
    return tagsText
      .split(",")
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);
  }

  function updateImportMeta(parsed) {
    const typeLabel = parsed.type === "collection" ? "收藏" : "原创";
    elements.importMeta.innerHTML =
      "<strong>已导入：</strong>" +
      escapeHtml(state.importedFileName) +
      "<br><strong>识别标题：</strong>" +
      escapeHtml(parsed.title) +
      "<br><strong>识别类型：</strong>" +
      typeLabel +
      "<br><strong>识别日期：</strong>" +
      escapeHtml(parsed.date);
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
})();
