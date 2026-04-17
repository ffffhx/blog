# 个人博客

这是一个基于 `Next.js + React + TypeScript + Tailwind CSS` 的个人博客，部署目标是 `Vercel`。

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

## 部署到 Vercel

推荐直接使用 Vercel 的 Git 集成：

1. 在 Vercel 中导入这个仓库。
2. 保持默认的 Next.js 构建设置。
3. 生产分支指向 `main`。
4. 如需自定义域名，在 Vercel 项目设置里绑定即可。

当前仓库不再使用 GitHub Pages 和 Hexo 构建链路。
