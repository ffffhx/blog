# 私有文章

私有文章只维护一种数据产物：JSON。`/private-post/?slug=...` 使用站内的
`ArticleBody`、目录、图片灯箱和主题组件展示，导出脚本不再生成独立 HTML、CSS 或交互脚本。
旧 `/api/blog/:slug` 地址跳转到同一页面，正文 JSON 仍由 Garden API 鉴权后提供。
旧地址中的查询参数（包括凭证）不会转发；需要登录时由站点登录入口处理。

## 新增与更新

1. 在 `apps/site/source/_posts/` 的文章 frontmatter 中设置 `hidden: true`，并设置稳定的 ASCII `slug`。
2. 在仓库根目录执行 `pnpm sync:assets`，然后执行 `pnpm export:private`。
   默认自动发现所有隐藏文章；指定一篇可用 `pnpm export:private <slug>`。
3. 产物直接写入 `apps/garden-api/data/private-blog/<slug>.json`。将 JSON 部署到后端数据目录。

不需要先构建 Next.js，也不需要维护另一份文章清单。封面和正文的本地图片内联到 JSON；
缺少图片、找不到指定文章或 slug 不适用于 API 时，导出报错而不会静默跳过。
该流程不会自动修改远端数据，也不会删除本地没有源文的已有 JSON。
目前 `internship-defense` 的源文是“面试准备.md”，已属于公开文章，因此不再被默认私有导出选中；
已有 JSON 保留不动，后续是否删除由数据清理流程决定。

## 本地预览与部署

启动 API 时设置 `GARDEN_SITE_URL=http://localhost:3000`，启动站点时设置
`NEXT_PUBLIC_GARDEN_API_URL=http://localhost:8787`，分别运行 `pnpm api:start` 和 `pnpm dev`。
访问 `http://localhost:3000/private-post/?slug=<slug>`；正文请求仍要求作者身份。

线上 `GARDEN_SITE_URL` 默认是 `https://ffffhx.github.io/garden-lab`，包含 Pages 子路径。
已有 HTML 备份不再被服务读取，可以在确认 JSON 完整并备份后清理。
`hidden` 的公开附件隔离和远端删除同步属于另外的发布流程问题，本次没有改变这两项行为。
