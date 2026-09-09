# 文章 AI 解释与问答服务

博客使用 GitHub Pages 静态导出。选词解释和文章问答由本仓库 `apps/garden-api` 调用 Kimi，浏览器不持有 Kimi API key。

## 本地启动（PowerShell）

```powershell
# 终端 1
$env:KIMI_API_KEY = '你的 key'
pnpm api:dev

# 终端 2
$env:NEXT_PUBLIC_GARDEN_API_URL = 'http://127.0.0.1:8787'
pnpm dev
```

也支持 `MOONSHOT_API_KEY`。上游地址通过 `KIMI_BASE_URL` 配置，当前实现使用 `kimi-k2.5`。

选词解释优先使用 `NEXT_PUBLIC_SELECTION_EXPLAIN_API_URL`，否则使用 Garden 的 `/api/explain-selection`。
文章问答优先使用 `NEXT_PUBLIC_ARTICLE_CHAT_API_URL`，其次从选词解释地址推导，否则使用 Garden 的 `/api/chat-article`。
前端不再回退排行榜服务。显式覆盖配置时应填写实际 Garden 接口地址。

## 部署

后端由 `deploy/garden-api/compose.yaml` 部署，配置 `KIMI_API_KEY`；前端配置 `NEXT_PUBLIC_GARDEN_API_URL=https://124-221-36-36.anyip.dev:8443/garden-api`。Garden 当前 AI handler 尚未校验登录态或配额，不能假定私有入口的显示限制等于服务端鉴权。

## 请求与响应

`POST /api/explain-selection` 接受 `{ selection, context?, slug?, title? }`，返回 `{ explanation, answer }`。

`POST /api/chat-article` 接受 `{ articleText?, headings?, title?, messages: [{ role, content }] }`，返回 `{ message: { role: "assistant", content } }`。

接口实现位于 `apps/garden-api/src/selection-explainer.ts`。
