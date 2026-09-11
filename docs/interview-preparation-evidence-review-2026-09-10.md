**《面试准备》证据审查 · 2026-09-10**

结论：有多处需要修正的技术事实和实现描述，集中在 Open Token Board 的上传与存储、ProfilePilot 的控制协议和数据恢复保证。下面的“优先改”表示会改变面试中的技术结论，不代表发现了线上安全事故。

审查对象：[原文 L1](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:1)。已通读正文并查看权益架构配图，读取四个本地仓库的相关实现、已有浏览器评测记录，以及 React、SQLite、PostgreSQL、Chromium 等第一方资料。没有修改原文或项目源码。

| 本地仓库 | 审查时 HEAD | 提交日期 |
| --- | --- | --- |
| profilepilot | `507c9b7a014fda61179d199ee1ee30f7a748db73` | 2026-09-10 |
| agent-snapshots | `09313230e77de56c490592d53e885d6cb148add6` | 2026-09-09 |
| open-token-board | `cd20aef5e0f75f0aec5bd14b29fe0befce22e77c` | 2026-08-20 |
| agent-session-core | `c2dd6f2828d4766ec6b2278a4a57cc6cc5ebdddb` | 2026-07-05 |

源码结论以实际读取的工作区为准，不能把较新实现的差异直接当成对历史经历的否定。Open Token Board 工作区已有其他未提交改动；本次未改动这些文件。对于没有找到内部源码的部分，以下明确区分“文字自相矛盾”“通用原理错误”和“尚待核实”。

**1. 优先改：Open Token Board 的 staging 是内存 Map，并非数据库临时表。**

位置：[原文 L588](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:588)、[原文 L589](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:589)。

证据：[Open Token Board server.ts:190](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/apps/token-board-api/src/server.ts:190) 定义 `events: Map<string, TokenUsageEvent>` 和进程级 `usageReplaceStages = new Map()`；[Open Token Board server.ts:2582](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/apps/token-board-api/src/server.ts:2582) 创建暂存对象；[Open Token Board server.ts:2618](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/apps/token-board-api/src/server.ts:2618) 把事件数组传入存储层。真正的 PostgreSQL 替换在 [Open Token Board token-board-storage.ts:420](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/packages/token-board-core/src/token-board-storage.ts:420)：BEGIN → DELETE → 分批 INSERT → COMMIT，失败 ROLLBACK。

影响：原文的“staging 临时表”“从 staging 批量转移至正式表”会让面试官误以为实现了数据库持久化暂存。实际上暂存状态不跨 API 进程共享，进程重启或 30 分钟暂存过期后需要重新 start；提交前旧历史仍在。

建议：改成“API 进程内暂存分批事件，校验完整性后，在 PostgreSQL 单事务中替换该用户历史”。扩展到多实例时，另行讨论共享暂存或请求路由约束。

**2. 优先改：SHA256 校验的是事件 ID 清单，不是文件清单，也不覆盖完整事件内容。**

位置：[原文 L588](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:588)。

证据：[Open Token Board server.ts:2718](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/apps/token-board-api/src/server.ts:2718) 的 `tokenEventManifestDigest` 只取 `upstreamEventId || id`，排序、换行连接后计算 SHA256；没有读取文件名、文件内容或 Token 字段。客户端 [Open Token Board agent.ts:137](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/apps/token-board-api/src/agent.ts:137) 也用事件摘要。

实际验证：提取并执行该函数体，保持事件 ID 相同，把 `totalTokens` 从 100 改为 900，摘要完全相同。

建议：写成“核验预期事件数和事件 ID 集合摘要”。这能发现部分漏传或 ID 集合不符，不能据此声称完整内容未被改变、日志真实可信，或客户端扫描一定完整。

**3. 优先改：服务端 SQL 是带条件的 DO UPDATE，不是 DO NOTHING。**

位置：[原文 L586](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:586)、[原文 L599](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:599)。

证据：[Open Token Board token-board-storage.ts:1494](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/packages/token-board-core/src/token-board-storage.ts:1494) 明确是 `ON CONFLICT (id) DO UPDATE ... WHERE ... IS DISTINCT FROM ...`；[Open Token Board token-board-storage.ts:1394](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/packages/token-board-core/src/token-board-storage.ts:1394) 可更新的字段包括 input/output/total tokens、cost、session title 等。相同内容跳过写入，纠正后的内容可以覆盖。

事件键也应说明层次：[agent-session-core token-events.mjs:32](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/agent-session-core/src/projections/token-events.mjs:32) 生成 `asc:<engine>:<sessionId>:<seq>`；[Open Token Board token-board-automation.ts:397](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/packages/token-board-core/src/token-board-automation.ts:397) 再结合用户、source、upstream ID 生成哈希主键。旧/custom 路径有包含 Token 值的兼容键。

建议：写成“稳定事件标识 + 唯一主键 + 有变化才更新的 upsert，在避免重复累加的同时允许修正数据”。不要把上游事件键与数据库主键混写。

**4. 优先改：当前默认 Agent 没有接通所宣称的 Gemini 用量采集链路。**

位置：[原文 L570](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:570)。

证据：[Open Token Board agent.ts:288](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/apps/token-board-api/src/agent.ts:288) 无条件调用 `collectLocalTokenUsageViaAscWithReport`。[Open Token Board asc-collector.ts:57](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/packages/token-board-core/src/asc-collector.ts:57) 的默认发现根只有 Codex/Claude；旧收集器确实存在 Gemini 解析代码，但“代码里存在解析器”不等于主入口已经调用。

实际验证：使用仓库的 Gemini fixture `fixtures/token-usage/gemini-cli/gemini-fixture/chats/session-a.jsonl`。旧 `parseUsageFile` 携带正确的 `source`、`filePath` 上下文解析出 2 条事件；当前 ASC 收集器对同一 fixture 所在目录发现 1 个文件，但返回 0 条用量事件。

建议：将“默认采集 Codex、Claude、Gemini”收窄为当前真实接通的范围，单独说明旧解析器支持或待接入能力。若介绍的是历史版本，标明版本及对应入口。

**5. 其次改：checkpoint 的作用写成了优化扫描，当前实现主要是在减少重复上传。**

位置：[原文 L585](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:585)。

证据：[Open Token Board agent.ts:205](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/apps/token-board-api/src/agent.ts:205) 先完整调用收集流程，再使用 `uploadedIds` 过滤待上传事件；[Open Token Board asc-collector.ts:263](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/packages/token-board-core/src/asc-collector.ts:263) 遍历发现的文件并调用 `parseSessionFile`。这条链路没有以文件 offset 为水位跳过已解析字节。物理文件的 dev/inode 去重则确实存在于 [agent-session-core discovery.mjs:120](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/agent-session-core/src/discovery.mjs:120)。

建议：分开写“扫描端按 dev/inode 去重；上传端保存已上传事件 ID，减少重复上报”。若要讲增量扫描，需要补出真正的文件 offset/checkpoint 实现。

**6. 优先改：“零误差”“数据可信”和“精确核算真实成本”超出了现有机制能证明的范围。**

位置：[原文 L574](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:574)、[原文 L591](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:591)、[原文 L605](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:605)。

证据：第 2、3 项分别说明摘要只覆盖 ID，以及幂等只处理相同身份事件。[agent-session-core token-events.mjs:48](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/agent-session-core/src/projections/token-events.mjs:48) 调用 `estimateCostUsd`；[Open Token Board token-leaderboard.ts:2042](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/packages/token-board-core/src/token-leaderboard.ts:2042) 按模型定价估算，并存在默认缓存价格回退。这不是与供应商账单逐笔结算的证明。当前收集器还明确处理了解析失败、事件清洗失败等情况。

建议：写成“统一已支持日志的统计口径，以固定样本验证重试幂等；按配置模型单价估算等价 API 成本”。“千万级 Token 零误差”如要保留，需要样本、独立对账基准、时间范围和误差定义；不能用唯一主键证明日志没有漏报或内容真实。

**7. 其次改：PostgreSQL 事务那段把‘读到已提交的空档’叫成了脏读。**

位置：[原文 L611](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:611)。

[PostgreSQL 官方隔离级别说明](https://www.postgresql.org/docs/current/transaction-iso.html) 明确：脏读是读取其他事务尚未提交的数据；PG 的 Read Uncommitted 实际也按 Read Committed 处理，不允许这种脏读。

若 DELETE 和 INSERT 各自提交，中间读到空表是已提交的中间状态。把两者放进同一事务，解决的是历史替换的原子性与外部可见性。本次确认了事务语句，但没有据此宣称任意并发 replace/ingest 都已经串行化；[Open Token Board token-board-storage.ts:420](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/open-token-board/packages/token-board-core/src/token-board-storage.ts:420) 没有显式设置 SERIALIZABLE 或用户级互斥。

建议：写“避免删除已提交、插入尚未提交时暴露空档或留下不完整历史”。

**8. 其次改：ProfilePilot 自动换 Profile 确实存在，但不是文中所写的 Gateway autoSwitch 接口。**

位置：[原文 L230](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:230)、[原文 L302](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:302)。

证据：[ProfilePilot agent-browser-wrapper.ts:531](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/agent-browser-wrapper.ts:531) 调用 wrapper 的自动选择函数；[ProfilePilot agent-browser-wrapper.ts:956](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/agent-browser-wrapper.ts:956) 在本地租约冲突后筛选候选、重写 CDP 参数。随后 [ProfilePilot agent-browser-wrapper.ts:2225](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/agent-browser-wrapper.ts:2225) 向 Gateway 发送具体 `publicPort`，请求里没有 `autoSwitch`。[ProfilePilot browser-gateway-control.ts:216](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/browser-gateway-control.ts:216) 的 Gateway acquire 只检查指定端口，发生冲突返回 `PROFILE_LEASE_CONFLICT`。

已有测试 [ProfilePilot agent-browser-wrapper.test.js:1361](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/tests/agent-browser-wrapper.test.js:1361) 还覆盖了自动切换；因此不能把该功能本身判为不存在。

建议：时序改成“wrapper 本地租约选择/候选切换 → 对确定端口申请 Gateway 租约与 Ticket”。也别把本地租约选到候选夸成后续 Gateway 握手必不冲突。

**9. 优先改：接管时缓冲的是浏览器事件，Agent 指令被拒绝；当前实现也不是四个状态的单一枚举。**

位置：[原文 L240](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:240)、[原文 L241](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:241)、[原文 L242](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:242)。原文后面的 [原文 L316](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:316) 反而写得更接近实现，前后需要统一。

证据：[ProfilePilot browser-gateway-server.ts:1209](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/browser-gateway-server.ts:1209) 对 parked/quiescing 连接立即返回错误，不把指令排队留到交还后执行。[ProfilePilot browser-gateway-server.ts:442](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/browser-gateway-server.ts:442) 保留支持的驱动连接，暂存浏览器推送事件；交还后重放事件。[ProfilePilot browser-gateway-server.test.js:205](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/tests/browser-gateway-server.test.js:205)、[ProfilePilot browser-gateway-server.test.js:240](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/tests/browser-gateway-server.test.js:240) 明确检查同一 socket 保留以及 parked command 不到达 Chrome。

[ProfilePilot browser-gateway-control.ts:11](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/browser-gateway-control.ts:11) 实际把 ownership、sessionStatus、agentHealth、driverState 分开建模，不能用 `active/parked/takenOver/resumed` 四个词代替真实状态结构。

建议：写“用户接管后保留 Session/可恢复连接，拒绝 Agent 操作、有限缓冲浏览器事件；交还后更新控制代次并重新观察页面”。“强接管必杀 daemon”如指旧模式，需要单列版本或入口。

**10. 优先改：pipe 没有让整台机器‘不暴露任何可探测网络端口’。**

位置：[原文 L250](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:250)、[原文 L307](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:307)。

证据：[ProfilePilot browser-gateway-server.ts:155](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/browser-gateway-server.ts:155) 默认监听 `127.0.0.1`，[ProfilePilot browser-gateway-server.ts:203](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/browser-gateway-server.ts:203) 在逻辑端口上 `server.listen`；[ProfilePilot browser-gateway-daemon.ts:442](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/browser-gateway-daemon.ts:442) 返回 `ws://127.0.0.1:<port>/...`。

建议：准确说“Chrome 后端使用 pipe，不开放其原生 TCP CDP 入口；Gateway 在 loopback 提供带 Ticket 的代理端点”。这能减少直接暴露的调试面，不能推出“本机无端口”或“杜绝公网/内网渗透”。

**11. 明确事实错误：DevToolsActivePort 并非 Chrome 144+ 新增。**

位置：[原文 L251](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:251)。

证据：[Chrome DevTools 官方仓库的 2017 年 FAQ](https://github.com/ChromeDevTools/devtools-protocol/issues/55) 已说明该文件；[2017 年 Catapult 源码提交](https://chromium.googlesource.com/catapult.git/+/a586b0072a208470e55680d2d6f097e5b7c674ff%5E%21/) 已有读取相关实现。本地 [ProfilePilot chrome-launch.ts:437](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/chrome-launch.ts:437) 使用它发现 `--remote-debugging-port=0` 分配的端口。

Chrome 144+ 的自动连接能力是另一件事，不能混同于该文件首次出现。

建议：删除“Chrome 144+ 新增”，改为“兼容通过 DevToolsActivePort 发现动态调试端口”。

**12. 优先改：同步前保留临时旧副本，不等于持久化快照和‘随时秒级一键回滚’。**

位置：[原文 L290](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:290)。

证据：[ProfilePilot profile-manager.ts:2703](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/profile-manager.ts:2703) 逐项执行复制；[ProfilePilot account-sync.ts:889](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/account-sync.ts:889) 先将旧目标改名，失败时尝试恢复，但成功后在 L919–920 删除 previous 副本。[ProfilePilot profile-manager.ts:2666](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/profile-manager.ts:2666) 的快照主要用于保留扩展 Preferences，不是保留所有账号数据的历史版本。

建议：改为“采用分项 staging 替换与失败恢复，保护被替换路径和目标扩展配置”。这条调用链不能支持成功同步后任意时刻一键回滚，也不能证明整个 Profile 跨多个存储目录是一个原子快照。若另有完整快照入口，需要提供对应实现再保留原句。

**13. 其次改：Windows App-Bound Encryption 的限制不能解释成‘密钥加密绑定默认目录’，也不能推出 100% 无损克隆。**

位置：[原文 L271](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:271)、[原文 L281](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:281)。

[Chromium 的支持条件检查](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/os_crypt/app_bound_encryption_win.cc) 包含是否使用默认 user-data-dir；[提权服务调用者校验源码](https://raw.githubusercontent.com/chromium/chromium/main/chrome/elevation_service/caller_validation.cc) 的路径校验对象是调用进程的可执行文件路径。支持条件与加密数据绑定对象不能混为一谈。

本地 [ProfilePilot account-sync.ts:420](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/account-sync.ts:420) 做的是复制已有 `os_crypt.encrypted_key`，并没有破解 App-Bound Encryption。它只保证这一步 Local State 的原子写入，不保证全部网站、扩展及服务端 Session 都可用。[ProfilePilot profile-manager.ts:2639](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/profile-manager.ts:2639) 还有 Windows 同步支持限制。

建议：写“分别适配 macOS 和 Windows 的本机 Profile 同步；在兼容的 Windows 隔离 Profile 间同步旧式密钥与指定存储”。“跨平台”应指分别支持两平台，而非把一份加密 Profile 任意跨 OS 搬运；“100%”改为已验证的环境和站点范围。

**14. 其次改：closed Shadow DOM 提供封装，不是让宿主 JS 无法干扰的安全边界。**

位置：[原文 L245](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:245)。

证据：[ProfilePilot overlay-script.ts:382](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/overlay-script.ts:382) 给宿主节点设置 aria-hidden 并创建 closed root；宿主元素仍在同一 document 中。网页 JS 仍能操作或删除这个宿主元素。项目自己在 [ProfilePilot agent-overlay.ts:645](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/agent-overlay.ts:645) 就用 `document.getElementById(...).remove()` 移除它，说明 closed 只限制直接取得 shadowRoot，不会让宿主节点不可操作。

建议：改成“用 Shadow DOM 和样式重置减少页面样式冲突，closed 模式减少外部误访问”；删掉“彻底杜绝全局 CSS/JS 干扰”。aria-hidden 也只针对可访问性树，不能保证视觉或坐标型 Agent 永不点击状态条。

**15. 明确技术错误：只有把状态移出 Context 才能局部更新。**

位置：[原文 L367](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:367)。

Context 消费者会因 context 变化而更新，这部分正确；但“只有”不成立。[React memo 官方文档](https://react.dev/reference/react/memo#updating-a-memoized-component-using-a-context) 明确给出另一种做法：外层读取 Context，把需要的局部值作为 props 传给 memo 子组件。拆分 Context 等方案也能缩小更新范围。

建议：写“memo 无法直接拦截组件自身消费的 Context 更新；本项目通过稳定 store 引用与字段级订阅减少无关单元格更新”。另外，Ref 写入本身不触发渲染，但订阅通知后的 React 更新仍会发生，不宜把整体方案说成脱离 React 协调。

**16. 明确口径错误：10 秒降到 1.8 秒，是耗时减少 82%。**

位置：[原文 L361](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:361)。

计算：`(10 - 1.8) / 10 = 82%`；速度比 `10 / 1.8 ≈ 5.56`。如果用速度提升百分比，是约 455.6%，不是 82%。

建议：直接写“切换编辑态耗时减少约 82%”。[原文 L362](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:362) 的“稳定 60fps”“彻底消除丢帧”是另一项测量结论，需要逐帧/交互记录，不能由 1.8 秒的切换耗时推出。

**17. 其次改：浏览器工具对比丢失了评测环境限定，且遗漏已记录的失败。**

位置：[原文 L206](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:206) 到 L213。

这些工具包含商业宿主集成，不能统称“六款开源工具”。关于具体能力，至少两处需改：

- `playwright-cli` 的“无明显功能不足”省略了真实目标场景中的失败。[评测 CLAUDE-ROUND-2026-06-20-SUMMARY.md:35](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/browser-tool-bench/results/CLAUDE-ROUND-2026-06-20-SUMMARY.md:35) 记录指定现成 9223 Profile 时，在扩展 target 枚举处断言失败，外场两轮均无法运行；同报告明确区分自管浏览器和 attach 模式。应写“自管模式能力较完整，接入既有 Profile 在当时环境中遇到兼容问题”。
- Chrome DevTools MCP “强绑定特定 userDataDir”不准确。[官方配置](https://raw.githubusercontent.com/ChromeDevTools/chrome-devtools-mcp/main/docs/configuration.md) 提供 userDataDir、browserUrl、wsEndpoint。没有原生 state save/load 命令，不能扩张成浏览器状态在任何情况下都不可导出或迁移。

对 @browser 文件上传等负面结论，本地 [评测 REPORT.md:133](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/browser-tool-bench/results/frontdev-2026-06-19-t12-t20/browser/REPORT.md:133) 确实保留了当时 API 缺少 setInputFiles 的证据，可以保留为“2026-06-19 被测宿主上下文的限制”，不宜写成永远不支持。这里没有重测商业宿主当前能力。

建议：在表格前补日期、版本、宿主、连接模式，并区分原生命令、受支持脚本兜底和实测失败。评测结果本身有价值，无须夸大为无条件的产品能力定论。

**18. 其次改：FTS5 trigram 对中文短词有边界，不能直接承诺所有查询毫秒级。**

位置：[原文 L538](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:538)、[原文 L564](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:564)。

证据：[Agent Snapshots search-index.mts:408](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/agent-snapshots/src/server/search-index.mts:408) 把至少 3 字符的词送入 MATCH；短词转为 LIKE 条件，没有长词时退化到普通 docs 表的 LIKE 查询。[Agent Snapshots search-index.mts:116](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/agent-snapshots/src/server/search-index.mts:116) 还处理 SQLite 构建不包含 FTS5 的情况。[SQLite 官方说明](https://www.sqlite.org/fts5.html#the_trigram_tokenizer) 也说明少于 3 个 Unicode 字符不能直接匹配 trigram 全文查询。

验证：Python SQLite 3.45.3 内存库插入 abcdef 后，MATCH ab 为 0 条，MATCH abc 为 1 条；本机 Node 22.14.0 的 node:sqlite 本身没有 FTS5，创建虚表报 no such module: fts5。后者说明运行时能力也需注明，不等于该应用一定无法搜索，因为源码有 LIKE 回退。

建议：写“优先使用 FTS5 trigram；短关键词及缺少 FTS5 的环境走 LIKE 回退”。毫秒级要附数据规模及统计分位；“绝对精确”改成“适合已知关键词的文本匹配”。

**19. 其次改：本地 embedding 和统一脱敏规则都有适用边界。**

位置：[原文 L539](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:539)、[原文 L542](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:542)。

[Agent Snapshots semantic-search.mts:135](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/agent-snapshots/src/server/semantic-search.mts:135) 允许环境变量覆盖 Ollama 地址，L139 的标准化函数接受任意 HTTP(S) 地址，L295 会向该地址发送 embedding 请求。因此“数据不出本机”成立的前提是配置了本机服务，而非代码强制不允许远端。已执行标准化函数确认远端示例 URL 被接受，没有发出网络请求。

[Agent Snapshots privacy.ts:146](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/agent-snapshots/src/core/privacy.ts:146) 的 .env 提及规则是 `detectOnly: true`；L199 的脱敏函数会跳过这类规则。实际验证“read .env”会出现提示，但导出文本保留原样。这是有意设计，并非泄露证明，恰好说明不能把“所有告警”都描述成“自动替换”。统一字典确实减少两套规则漂移，不能保证发现任意未知秘密或处理图片中的敏感内容。

建议：写“默认本地 Ollama，可配置服务地址；已知敏感文本规则共享检测与脱敏实现，纯提示类规则保留原文，导出仍需人工复核”。

**20. 优先改：账号切换段落对前后端和凭证接触范围的描述自相矛盾。**

位置：[原文 L173](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:173)、[原文 L181](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:181)、[原文 L193](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:193)。

原文先把 Stone 写成插件后端，后面又多次写成 Stone 前端；同时宣称插件“全流程仅持有受限业务 Token，不直接接触……高危敏感凭据”，但 L196–197 又要求插件接收目标 Session 并写入 Cookie。

这能证明文字矛盾，尚不能证明真实系统权限设计有漏洞。也不能仅凭这些文字断言企业主账号 Session 实际被下发。

建议：统一明确 Stone 的服务端/BFF 与前端角色。若真实实现如此，可写“插件不保存账号密码；持有受限业务 Token，在切换时临时接收允许切换的测试账号 Session 并写入浏览器 Cookie”。Session 本身是凭证，不能用“不保存密码”代替“不接触凭证”。UID 白名单、鉴权和目标账号授权范围需由内部代码确认。

**21. 其次改：chrome.cookies 和 prompt=none 被赋予了接口本身不保证的语义。**

位置：[原文 L185](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:185)、[原文 L197](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/garden-lab/apps/site/source/_posts/2026/08/21/面试准备.md:197)。

[Chrome cookies 官方文档](https://developer.chrome.com/docs/extensions/reference/api/cookies#event-onChanged) 说明覆盖 Cookie 会经历删除旧 Cookie、写入新 Cookie 两个变更事件；API 没有提供“整个账号环境”的跨 Cookie/标签页/业务状态事务。即使设置单个 Cookie 成功，也不能推出账号、企业和权限套餐整体原子切换。

[OpenID Connect 规范](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest) 中 prompt=none 的含义是认证服务器不展示交互界面；既有认证或同意不满足条件时可以返回 login_required / interaction_required。给任意 Coze 页面 URL 加参数，也不会天然完成 SSO，必须有宿主到身份提供方的真实处理链路。

建议：分别写成“设置目标 Cookie 后刷新并校验环境”以及“已有有效 SSO 状态时尝试静默认证，失败时回退交互登录”。内部具体处理流程待源码确认。

**内部项目尚待核实的部分，不应直接判错。**

| 内容 | 已有证据与需要补充的材料 |
| --- | --- |
| 商业化判断与推荐公式 | 原文 L62、L76 和配图确实采用两个基准。假设当前额度 100、已用 90、本次加 15，所需总量是 105，但推荐门槛是 115；额度 110 的方案足以执行操作，却会被过滤。这证明两套公式不是同一种“最低够用”策略，不能证明真实业务规则错了。需要确认 requestedAddCount 是操作新增量、额度缺口还是希望新增的容量；若是产品刻意采用保守规则，应明说。 |
| 历史套餐固定映射 | 图中历史分支不按需求量再次筛选，因此“总能推荐足够套餐”不能不加条件地覆盖历史分支。是否有后续补偿步骤，需要内部实现。 |
| 支付后自动恢复业务 | 原文 L104–106 描述支付回调、额度同步与继续/自动重试。需要支付成功与权益生效的实际校验、异步通知/轮询、取消与失败路径。图示本身不能证明这些都已实现。 |
| useBenefitCheck 调用契约 | L90 看起来像在点击回调里直接调用 Hook。若它是 React Hook，应在组件顶层调用，点击时调用它返回的检查函数；若只是伪代码，应标注。未见源码，不能判定真正违反 Hooks 规则。 |
| 商业化重构 88 API、518 文件、6 个子包、零故障 | 需要入口导出清单、迁移前后提交范围、文件统计规则、上线观察窗口。当前找到的目录与架构图不能独立验证数字和个人贡献。 |
| TikTok 10s→5s→1.8s、输入约 1s→60fps | 需要改造前后源码、同条件 trace/Profiler、机型、构建模式、行列数与分页状态。原文后面的排查流程已注明是建议流程，这个限定应保留；不能倒过来把它当成当年的实验记录。 |
| 星环自研 Vite 插件和接入周期 | ESM 桥接、base/server.origin、沙箱/HMR 边界的说明总体合理；[Vite base](https://vite.dev/config/shared-options.html#base) 和 [server.origin](https://vite.dev/config/server-options.html#server-origin) 支持文中对配置语义的区分。但插件是否本人实现、如何接入、半天接入成果，需要项目源码或历史记录。 |

已经向用户询问内部项目路径；截至本报告写入，尚未取得补充路径。不能用公开版 Coze 的代码替代内部商业化系统来证明私有业务实现。

**可保留、已有源码支撑的技术亮点。**

- ProfilePilot 的一次性 HMAC Ticket、默认 15 秒 TTL、代次校验与人机控制权切换，有 [ProfilePilot browser-gateway-control.ts:1](C:/Users/aa182/Documents/Codex/2026-08-22/new-chat-2/repositories/profilepilot/src/main/browser-gateway-control.ts:1) 等真实实现；准确讲清各状态与管道，比“彻底杜绝风险”更有说服力。
- Agent Snapshots 的统一领域解析、SQLite 索引/回退、本地向量检索、共享文本脱敏规则都能找到实现。agent-session-core 的 package.json 也支持“零第三方运行时依赖”的说法。
- Open Token Board 的分批完整性校验、提交前保留旧历史、PostgreSQL 删除/插入同事务、稳定事件身份与有条件 upsert 都有依据，修正文案即可保留这些工程亮点。
- 表格文档后半段对测试条件、根因假设、组合收益和 INP 口径的限定比前半段更严谨，建议前后统一。

**本次验证记录。**

1. 在 open-token-board 执行 `node --import tsx --test --test-name-pattern='atomic replacement manifest' tests/api/usage.test.ts`：1 项通过。该 harness 使用临时 JSON 存储，并关闭日报/周报，不是 PostgreSQL 实例测试。
2. 执行实际摘要函数体，确认更改 Token 内容但保留 ID 不改变 digest。
3. 执行 Agent Snapshots 的实际脱敏与 URL 标准化函数，确认 detectOnly 例外及可配置远端地址。
4. Python SQLite 内存库验证两字符/三字符 trigram 差异；记录 Node 内置 SQLite 缺少 FTS5 的环境限制。
5. 对仓库 Gemini fixture 对照旧解析器与当前 ASC 收集链路：2 条对 0 条用量事件。
6. 复算耗时减少比例为 82%，速度比约 5.56。没有把此算术验证当作 10 秒和 1.8 秒原始数据的真实性证明。

纯排版小问题：L97 的分支 B 标记缺失，L246/L250 的反引号与粗体标记错位，L522“是一个的”多了“的”，L169 的“上述时序图”缺少对应图。可以在事实修订时一并处理。
