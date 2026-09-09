# Garden 快照协议

快照发布、读取和删除统一由 Garden API 负责。前端、后端及 CLI 共同依赖 `@garden-lab/snapshot-contract` 的版本、类型和运行时校验。

## 接口

- `POST /api/snapshots`：Garden Bearer 会话或独立发布 token 鉴权。请求 `{ schemaVersion: 1, snapshot: { title, turns, ... }, shareId?, expiresInDays?, siteUrl? }`。新建返回 201，同一发布者用同一 `shareId` 更新返回 200，响应 `{ schemaVersion: 1, id, url, createdAt, updatedAt, expiresAt, ... }`。
- `GET /api/snapshots/:id`：公开只读，返回 `{ schemaVersion: 1, share: { id, url, title, createdAt, updatedAt, expiresAt, turnCount, redacted, ... }, snapshot: { turns, ... } }`。不存在或已过期返回 404。
- `DELETE /api/snapshots/:id`：仅发布者可删除。未登录返回 401，非发布者返回 403。

ID 支持 1–80 个字母、数字、下划线和连字符，首字符为字母或数字，兼容 CLI 的 `snap_...` 稳定 ID。时间统一为 ISO 8601 字符串。过期天数为 1–3650 的整数；新建省略表示不过期，更新省略保留原过期时间。

`turns` 必须为数组。原始 `text`（包括 `<T>`、代码和尖括号）保留，只清洗供浏览器渲染的 `html`。协议不一致时分享页显示错误，不再把无效响应当成空白快照。

## 配置

| 配置 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_GARDEN_API_URL` | 博客前端 Garden API 地址，线上为 `https://124-221-36-36.anyip.dev:8443/garden-api` |
| `NEXT_PUBLIC_SNAPSHOT_SHARE_API_URL` | 可选的快照 API 显式覆盖；默认使用 Garden 地址 |
| `GARDEN_API_PUBLIC_URL` | 后端外部 API 地址，不用于生成前端分享页链接 |
| `GARDEN_SITE_URL` | 后端默认分享站点，默认 `https://ffffhx.github.io/garden-lab` |
| `GARDEN_SNAPSHOT_UPLOAD_TOKEN` | 后端与本地发布工具共享的独立发布 token；不要使用 `NEXT_PUBLIC_` 前缀 |
| `SNAPSHOT_SHARE_API_URL` / `GARDEN_API_URL` | CLI/daemon 的 Garden API 地址 |
| `SNAPSHOT_SHARE_TOKEN` | CLI 的显式 Garden 凭证，也可使用上面的上传 token 或 `~/.garden-snapshot.json` 的 `token` 字段 |
| `SNAPSHOT_SHARE_SITE_URL` | CLI 的分享网站地址；后端只接受配置站点或允许的 origin |

独立发布 token 仅用于快照写操作，不用于博客作者登录。不同电脑共用同一个发布 token 时，视为同一发布者，可更新该 token 发布的稳定 ID。

## 部署与已有数据

1. 在 Garden API 部署环境设置 `GARDEN_SITE_URL` 和随机生成的 `GARDEN_SNAPSHOT_UPLOAD_TOKEN`，重建 `deploy/garden-api` 镜像。镜像包含共享协议包。
2. 本地工具配置相同 token 和 Garden API 地址；已有 macOS daemon 需重新运行安装命令，替换旧 plist 里的地址。
3. 发布站点前端。两份 Pages 工作流均使用 Garden API 地址；登录功能也不再回退旧排行榜后端。

Garden 现有 `snapshots.json` 中的 `data: snapshot` 和 `data: { snapshot, ... }` 均可读取，不改变原分享 ID。不含 `turns` 的任意 JSON 不再被视为合法快照。早期匿名记录继续公开读取，但不会被新发布者冒领更新或删除，需维护者在服务器处理。

存储改为单进程串行写入和临时文件原子替换；解析损坏会报错并保留原文件。仍是单实例文件存储，不支持多个进程共同写同一文件。

离线迁移工具为 `scripts/migrate-snapshot-shares.mjs`，输入 Garden JSON、PostgreSQL `snapshot_shares` 完整行导出的 JSON 数组、全新输出路径和明确的源发布者 ID。工具拒绝 ID 冲突、未知发布者和无效快照，保留 payload、创建/更新时间、过期时间及分享 ID；旧摘要记录保留原字段并增加正文消息。替换数据前必须停止 Garden 写入并备份，不能对运行中的文件直接合并。

## 2026-09-09 线上迁移记录

- 从 Token Board PostgreSQL 导入 10 条快照，发布者核实为站点作者；写入归属映射为 Garden 专用上传凭证。
- Garden 6 条历史摘要转换为兼容消息，共 16 条记录，全部通过线上 schema v1 读取验证。原 Token Board 数据保留供回滚。
- Caddy 的 `/token-board/api/snapshots*` 兼容路径已转发到 Garden，旧路径也使用 Garden 鉴权，不再写入 Token Board。其他 Token Board 路由不变。
- 服务器备份目录：`/home/deploy/garden-snapshot-backups/20260909T015655Z`，包含原配置、数据、迁移前后导出和 Caddy 配置；旧镜像标签为 `garden-api-rollback:20260909T015655Z`。
- 本机 `~/.garden-snapshot.json` 已配置 `token`、`apiUrl` 和 `siteUrl` 并限制文件权限。CLI 优先级为显式参数、环境变量、该配置文件、默认值；凭证不进入仓库。
