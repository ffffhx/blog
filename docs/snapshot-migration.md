# 快照归属与迁移记录

快照功能统一归独立项目 [Agent Snapshots](https://ffffhx.github.io/agent-snapshots/) 维护。Garden 只保留项目入口和 `/snapshots/share/?id=...`、`/snapshots/viewer/` 的兼容跳转；跳转只转交分享 ID，不传递 Garden 登录凭证或任意 API 地址。

2026-09-09 核对并迁移：

- 实际分享服务运行在腾讯云 `124.221.36.36`，沿用 `codex-snapshot-share.service`、`/opt/codex-snapshots` 和 `8791` 端口；它属于独立项目，不是 Garden API。
- 独立服务原有 4 条记录；Garden 的 16 条没有 ID 或完整 payload 重复，全部迁入，合计 20 条。保留正文、图片、ID、创建/更新时间和过期设置；原有 4 条不变。
- 数据文件为 `/var/lib/codex-snapshots/shares.json`。备份保存在 `/home/deploy/agent-snapshots-migration-backups/20260909T103638Z`，包含两个来源的数据、合并结果及旧配置。
- 独立站变量 `AGENT_SNAPSHOTS_PUBLIC_API_URL` 已设置为 `https://124-221-36-36.anyip.dev:8443/codex-snapshots`。旧阿里云地址和旧变量名没有被官网正确使用，现已修正。
- Caddy 将历史 `/garden-api/api/snapshots*` 和 `/token-board/api/snapshots*` 转交独立分享服务，以兼容旧读取地址；写入使用独立服务的鉴权。Garden 程序不再实现快照接口。
- 一次性导入工具和测试位于独立项目 `scripts/import-garden-snapshots.mjs`、`scripts/test-import-garden-snapshots.mjs`。导入前停止两侧写入，冲突时中止，不覆盖目标记录。

Garden 已移除旧 CLI、本地查看器、云端查看器、存储 handler、共享协议包及相关配置和依赖。后续快照开发、数据管理和桌面应用启动均在 `agent-snapshots` 仓库进行。
