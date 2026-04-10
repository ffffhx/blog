#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const [, , mode, ...rest] = process.argv;
const args = rest[0] === "--" ? rest.slice(1) : rest;
const title = (args[0] || "").trim();
const sourceUrl = (args[1] || "").trim();

if (!["original", "collection"].includes(mode)) {
  console.error('用法: node tools/new-entry.mjs <original|collection> "标题" [原文链接]');
  process.exit(1);
}

if (!title) {
  console.error("请提供文章标题。");
  console.error('示例: pnpm new:post -- "我的第一篇文章"');
  console.error('示例: pnpm new:collection -- "值得收藏的文章" "https://example.com"');
  process.exit(1);
}

const now = new Date();
const year = String(now.getFullYear());
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const hour = String(now.getHours()).padStart(2, "0");
const minute = String(now.getMinutes()).padStart(2, "0");
const second = String(now.getSeconds()).padStart(2, "0");
const timestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
const category = mode === "collection" ? "收藏" : "原创";
const targetDir = path.join(process.cwd(), "source", "_posts", year, month, day);

fs.mkdirSync(targetDir, { recursive: true });

const safeStem = title
  .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "") || `${mode}-${Date.now()}`;

let filename = `${safeStem}.md`;
let counter = 2;

while (fs.existsSync(path.join(targetDir, filename))) {
  filename = `${safeStem}-${counter}.md`;
  counter += 1;
}

const frontMatter = [
  "---",
  `title: ${JSON.stringify(title)}`,
  `date: ${timestamp}`,
  "categories:",
  `  - ${category}`,
  "tags:",
  "excerpt:",
];

if (mode === "collection") {
  frontMatter.push(`source_url: ${JSON.stringify(sourceUrl)}`);
}

frontMatter.push("---", "");

const body =
  mode === "collection"
    ? [
        "## 原文链接",
        sourceUrl ? `[${sourceUrl}](${sourceUrl})` : "请在这里填写原文链接。",
        "",
        "## 为什么收藏",
        "",
        "简单写下你为什么想长期保留这篇内容。",
        "",
        "## 我的摘录",
        "",
        "- ",
        "",
        "## 读后备注",
        "",
        "补充自己的理解、延伸阅读或后续行动。",
      ]
    : [
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
      ];

const filePath = path.join(targetDir, filename);
fs.writeFileSync(filePath, `${frontMatter.join("\n")}\n${body.join("\n")}\n`, "utf8");

console.log(`已创建: ${path.relative(process.cwd(), filePath)}`);
