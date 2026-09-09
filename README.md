# Garden Lab

这是一个基于 `Next.js + React + TypeScript + Tailwind CSS` 的个人数字花园与实验室，部署目标是 `GitHub Pages`。

内容目前按几个模块组织：

- 技术：源码解析、工程实践、工具使用和问题排查
- 健身：训练记录、动作笔记、饮食复盘和阶段总结
- 每日新闻：AI、前端与工程圈每天值得关注的热点速览

内容和页面保存在站点应用包里的 Markdown 文件中：

- 技术/健身文章与每日新闻：`apps/site/source/_posts/YYYY/MM/DD/*.md`
- 关于页：`apps/site/source/about/index.md`

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

仓库按 `pnpm-workspace.yaml` 管理几个边界清晰的 workspace 包：

- 根目录：monorepo 编排、CI、文档和统一命令代理
- `apps/site`：Next.js 静态站点、内容编译、页面和站点内领域逻辑
- `apps/garden-api`：博客登录和私有文章服务

私有文章由 `hidden: true` 自动发现，只导出 JSON，并统一在站点展示。导出、兼容旧地址和部署说明见 [私有文章流程](docs/private-posts.md)。

会话快照已完整迁移至 [Agent Snapshots](https://ffffhx.github.io/agent-snapshots/)。Garden 仅保留项目入口和旧分享地址跳转，不再维护快照工具、查看器或存储。数据与部署核对记录见 [快照迁移说明](docs/snapshot-migration.md)。

Token 排行榜的前端、后端、core、Docker 部署包和 agent 发布已经迁移到独立公开仓库：`https://github.com/ffffhx/open-token-board`。

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

`pnpm build` 会准备公开资源、同步文章图片并生成静态站点。

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
pnpm new:daily-news -- "2026-04-24 AI 与前端热点速览"
```

## 内容兼容说明

这次重构保留了现有 Markdown 内容和本地内容资源文件夹结构。

新站点会在内容编译阶段兼容这些能力：

- front matter：`title`、`date`、`categories`、`tags`、`excerpt`
- 标准 Markdown：标题、列表、引用、代码块、表格、链接、图片
- Hexo 风格的 `{% asset_img ... %}` 内容资源图片标签

内容图片会在开发和构建前自动同步到 `apps/site/public/post-assets/`，不需要手动复制。手动刷新公开静态资源可以运行：

```bash
pnpm prepare:public
```

## 独立 Token 排行榜

Token 用量采集、统计、后台同步和部署统一由 [Open Token Board](https://ffffhx.github.io/open-token-board/) 维护。Garden 只保留排行榜入口，不再采集本机用量或发布用量数据。安装和运维说明请查阅[独立仓库](https://github.com/ffffhx/open-token-board)。

## 部署到 GitHub Pages

仓库已经包含 GitHub Pages 的 Actions 工作流：

- 工作流文件：`.github/workflows/pages.yml`
- 构建输出：`apps/site/out/`
- 发布方式：推送到 `main` 后由 GitHub Actions 自动构建并部署

首次启用时需要在 GitHub 仓库里做一次设置：

1. 打开仓库 `Settings > Pages`
2. 在 `Build and deployment` 中把 `Source` 设为 `GitHub Actions`
3. 推送一次 `main` 分支，等待 `Deploy To GitHub Pages` 工作流完成

如果当前仓库保持 `ffffhx/garden-lab` 这个项目仓库形式，默认访问地址会是：

```text
https://ffffhx.github.io/garden-lab/
```

如果后续绑定了自定义域名，GitHub Pages 会给工作流注入新的站点基路径，当前配置不需要再手动改代码。

## 独立游戏站

游戏源码、素材、测试和房间服务由同级 `games` 仓库维护。博客保留 `/games/` 入口，并将旧的 `/farm-life-mvp/`、`/forest-shuffle/`、`/texas-holdem/` 及 `/games/farm-life/index.html` 跳转到独立站对应游戏。跳转保留房间号、座位和页内锚点。

博客构建不再编译游戏。游戏开发与部署请参阅 `games/README.md`。迁移差异与素材归档见 [核对记录](docs/game-migration-cleanup.md)。
