# 个人博客

这是一个基于 [Hexo 官方文档](https://hexo.io/zh-cn/docs/) 初始化的个人博客，主要用来放两类内容：

- 原创文章
- 收藏文章

## 本地开发

推荐使用 `pnpm`，当前仓库已经包含 `pnpm-lock.yaml`。

```bash
pnpm install
pnpm run server
```

默认访问地址：

```text
http://localhost:4000/
```

## 常用命令

启动本地服务：

```bash
pnpm run server
```

也可以使用：

```bash
pnpm dev
```

生成静态文件：

```bash
pnpm build
```

清理生成目录：

```bash
pnpm clean
```

新建原创文章：

```bash
pnpm new:post -- "我的第一篇文章"
```

新建收藏文章：

```bash
pnpm new:collection -- "值得收藏的文章" "https://example.com/article"
```

新建独立页面：

```bash
pnpm new:page -- about
```

在线导入 Markdown：

```text
/publish/
```

## 内容组织

- 原创文章默认归类到 `原创`
- 收藏文章默认归类到 `收藏`
- 文章文件保存在 `source/_posts/YYYY/MM/DD/`
- 文章图片资源会跟文章一起存放，因为已开启 `post_asset_folder: true`

## 发文入口

站点已经新增了一个发文入口：

- 本地预览时访问 `http://localhost:4000/publish/`
- GitHub Pages 上访问 `https://ffffhx.github.io/blog/publish/`

这个页面支持：

- 上传或拖拽 `.md` / `.markdown` 文件
- 实时预览导入后的 Markdown 渲染效果
- 直接在页面里手写文章
- 使用快捷按钮插入标题、引用、列表、代码块和链接
- 识别已有 front matter
- 调整标题、分类、日期、标签、摘要、原文链接
- 生成标准的 Hexo Markdown
- 直接保存到本地博客仓库
- 或下载生成后的 `.md` 文件

注意：

- “直接保存到本地博客仓库” 依赖 Chromium 浏览器的 File System Access API，推荐 Chrome 或 Edge。
- 如果浏览器不支持直接写入，可以先下载 `.md`，再手动放到 `source/_posts/YYYY/MM/DD/`。

## 上线前需要改的配置

发布前，至少检查这些配置：

- `/Users/bytedance/Code/blog/_config.yml` 里的 `title`
- `/Users/bytedance/Code/blog/_config.yml` 里的 `author`
- `/Users/bytedance/Code/blog/_config.yml` 里的 `url`

如果后续要部署到 GitHub Pages、Vercel 或其他静态托管平台，可以继续参考：

- [配置](https://hexo.io/zh-cn/docs/configuration)
- [写作](https://hexo.io/zh-cn/docs/writing)
- [前置数据](https://hexo.io/zh-cn/docs/front-matter)

## GitHub Pages

这个仓库已经按 GitHub Actions 的方式接好了 GitHub Pages。

- 如果仓库名是 `<你的 GitHub 用户名>.github.io`，博客地址会是 `https://<你的 GitHub 用户名>.github.io/`
- 如果仓库名是普通项目名，比如 `blog`，博客地址会是 `https://<你的 GitHub 用户名>.github.io/blog/`

工作流会在 GitHub 上自动判断这两种情况，并为 Hexo 生成正确的 `url` 和 `root`，所以不需要每次手动改 `/_config.yml`。

接入步骤：

1. 在 GitHub 创建一个仓库。
2. 把当前目录 push 到仓库的 `main` 分支。
3. 进入 GitHub 仓库的 `Settings > Pages`，将 `Source` 设为 `GitHub Actions`。
4. 等待 `.github/workflows/pages.yml` 跑完，GitHub Pages 就会发布。

如果后续要绑定自定义域名，再在 `source/` 下增加 `CNAME` 文件，并在 GitHub Pages 设置里配置域名。
