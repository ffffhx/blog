# 个人博客

这是一个基于 `Next.js + React + TypeScript + Tailwind CSS` 的个人博客，部署目标是 `GitHub Pages`。

内容仍然按两个大模块组织：

- 技术：源码解析、工程实践、工具使用和问题排查
- 健身：训练记录、动作笔记、饮食复盘和阶段总结

文章和页面内容继续保存在仓库里的 Markdown 文件中：

- 文章：`source/_posts/YYYY/MM/DD/*.md`
- 关于页：`source/about/index.md`

## 本地开发

推荐使用 `pnpm`。

```bash
pnpm install
pnpm dev
```

默认开发地址：

```text
http://localhost:3000
```

## 常用命令

启动开发环境：

```bash
pnpm dev
```

运行测试：

```bash
pnpm test
```

构建生产版本：

```bash
pnpm build
```

启动生产服务：

```bash
pnpm start
```

新建技术文章：

```bash
pnpm new:post -- "我的第一篇文章"
```

也可以显式指定模块：

```bash
pnpm new:tech -- "我的第一篇技术文章"
pnpm new:fitness -- "一周训练复盘"
```

## 内容兼容说明

这次重构保留了现有 Markdown 内容和本地文章资源文件夹结构。

新站点会在内容编译阶段兼容这些能力：

- front matter：`title`、`date`、`categories`、`tags`、`excerpt`
- 标准 Markdown：标题、列表、引用、代码块、表格、链接、图片
- Hexo 风格的 `{% asset_img ... %}` 文章资源图片标签

文章图片会在开发和构建前自动同步到 `public/post-assets/`，不需要手动复制。

## 部署到 GitHub Pages

仓库已经包含 GitHub Pages 的 Actions 工作流：

- 工作流文件：`.github/workflows/pages.yml`
- 构建输出：`out/`
- 发布方式：推送到 `main` 后由 GitHub Actions 自动构建并部署

首次启用时需要在 GitHub 仓库里做一次设置：

1. 打开仓库 `Settings > Pages`
2. 在 `Build and deployment` 中把 `Source` 设为 `GitHub Actions`
3. 推送一次 `main` 分支，等待 `Deploy To GitHub Pages` 工作流完成

如果当前仓库保持 `ffffhx/blog` 这个项目仓库形式，默认访问地址会是：

```text
https://ffffhx.github.io/blog/
```

如果后续绑定了自定义域名，GitHub Pages 会给工作流注入新的站点基路径，当前配置不需要再手动改代码。
