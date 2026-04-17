# 个人博客

这是一个基于 [Hexo 官方文档](https://hexo.io/zh-cn/docs/) 初始化的个人博客，当前按两个大模块组织内容：

- 技术：源码解析、工程实践、工具使用和问题排查
- 健身：训练记录、动作笔记、饮食复盘和阶段总结

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

新建技术文章：

```bash
pnpm new:post -- "我的第一篇文章"
```

也可以显式指定模块：

```bash
pnpm new:tech -- "我的第一篇技术文章"
pnpm new:fitness -- "一周训练复盘"
```

新建独立页面：

```bash
pnpm new:page -- about
```

## 内容组织

- 文章默认归类到 `技术`
- 健身相关文章归类到 `健身`
- 文章文件保存在 `source/_posts/YYYY/MM/DD/`
- 文章图片资源会跟文章一起存放，因为已开启 `post_asset_folder: true`

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
