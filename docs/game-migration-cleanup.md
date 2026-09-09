# 游戏迁移核对与清理

核对日期：2026-09-08。对比本仓库旧实现与同级 `games` 工作区；未覆盖独立游戏站的现有代码或未提交文件。

## 差异核对

- 森森不息、德州扑克：10 个领域文件与 5 个测试文件内容一致（忽略换行符）。两个房间服务只有迁移后的导入路径变化，公网代理脚本一致。
- 桌游组件：`games` 更新了公网 WebSocket 地址、修正带站点基路径的邀请链接，并将 Next Link 换成普通链接。
- 山居种田：博客的 `main.ts` 与 `games` 初始提交 `e41edc3` 一致。独立项目后续拆出存档和表现模块，修复交互、地图、图格与 UI；进度逻辑将照顾田地放在接委托之前，并补充对应断言。旧运行时素材均能在独立项目找到对应文件，其中 10 个已更新。
- 原始美术素材和旧生成器尚未迁移：已归档到 `games/src/farm-life/art-source/garden-lab-originals/`。共 5,396 个文件，压缩后逐文件核对字节一致。此归档不参与构建，避免旧生成器覆盖修复后的资源。

## 清理范围

删除博客内的游戏实现、领域逻辑、素材、房间服务、游戏测试、Phaser/Vite/ws 直接依赖及游戏构建命令。Vite/ws 仍可能被其他依赖间接使用，不强行从依赖树移除。

保留首页独立项目链接及 `/games/` 介绍页。旧游戏地址使用兼容静态托管的浏览器跳转，提供无 JavaScript 的跳转和手动链接，保留 `room`、`seat` 和 hash，不转发博客登录 token。

| 旧地址 | 独立站地址（默认） |
| --- | --- |
| `/farm-life-mvp/` | `https://ffffhx.github.io/games/farm-life/` |
| `/games/farm-life/`、`/games/farm-life/index.html` | `https://ffffhx.github.io/games/farm-life/` |
| `/forest-shuffle/` | `https://ffffhx.github.io/games/forest-shuffle/` |
| `/texas-holdem/` | `https://ffffhx.github.io/games/texas-holdem/` |

`/games/farm-life/index.html` 由静态导出的 `games/farm-life/index.html` 承接。上述游戏跳转页不再要求博客作者登录。目标站点仍可通过 `NEXT_PUBLIC_GAMES_SITE_URL` 配置。

博客与独立游戏站默认处于同一个 `ffffhx.github.io` origin，浏览器 localStorage 不按路径隔离；迁移保持游戏原有存储键，无需复制存档。如果另行更换域名，存档迁移需单独处理。
