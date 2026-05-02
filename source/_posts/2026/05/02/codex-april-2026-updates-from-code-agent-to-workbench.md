---
title: "Codex 最近一个月更新了什么：从代码 Agent 到常驻工作台"
date: "2026-05-02 23:30:00"
categories:
  - 技术
tags:
  - Codex
  - OpenAI
  - Agent
  - CLI
  - Desktop App
  - GPT-5.5
excerpt: "整理 2026-04-02 到 2026-05-02 这 30 天里 Codex 的主要更新：桌面 app、Browser Use、Computer Use、GPT-5.5、Codex Pets、CLI、插件、计费、安全和企业化。"
cover: "cover-v1.svg"
coverPosition: "below-title"
---

## 摘要

这篇文章整理的是 **2026-04-02 到 2026-05-02** 这 30 天里 Codex 的公开更新。口径以 [Codex 官方 changelog](https://developers.openai.com/codex/changelog)、OpenAI 官方博客、OpenAI Help Center 和 Codex app 文档为主。

先给结论：

**最近一个月的 Codex，不再只是“帮你改代码的终端 Agent”，而是在往一个常驻工作台演进：它能操作浏览器和桌面应用，能跨线程延续任务，能接入插件和企业环境，能用 GPT-5.5 处理更长的工程问题，也开始用 Codex Pets 这种桌面浮层把任务状态放到你的工作流旁边。**

如果只看功能名，会觉得更新很多、很散。但把它们放在一起看，主线其实很清楚：

1. Codex app 变成更完整的桌面工作台。
2. GPT-5.5 进入 Codex，补强长任务、调试、重构和知识工作。
3. CLI 和 App Server 继续底层化，支撑更多客户端、插件、权限和远程环境。
4. 计费、安全、Bedrock 和企业服务开始补齐，说明 Codex 正在从个人工具走向组织级部署。
5. Codex Pets 是一个小功能，但它透露了一个产品方向：Agent 的状态不应该只藏在窗口里。

{% asset_img figure-01.svg %}

## 1. 这次更新最大的变化：Codex 开始“常驻”

4 月 16 日的 [Codex for (almost) everything](https://openai.com/index/codex-for-almost-everything/) 是这个月最关键的节点。OpenAI 对 Codex 的描述明显变了：它不只是写代码，而是能进入更多软件开发生命周期里的环节，包括理解系统、检查输出、Review、生成资料、处理长期任务。

这次 app 层面的更新可以分成几组。

第一组是桌面和浏览器能力：

| 能力 | 这次变化 | 意义 |
| --- | --- | --- |
| Computer Use | macOS 上 Codex 可以通过自己的光标看、点、输入 | 可以处理没有 API 的桌面应用，适合前端验证和跨工具操作 |
| In-app browser | app 内置浏览器，可以在页面上评论 | 适合网页、应用、游戏的视觉迭代 |
| Browser Use | 4 月 23 日进一步支持 Codex 操作 app 内浏览器 | 可以点击本地页面、复现视觉问题、验证修复 |

第二组是长期任务能力：

| 能力 | 这次变化 | 意义 |
| --- | --- | --- |
| Thread automations | 自动化可以复用原线程上下文并定时唤醒 | 适合跨天跟进、监控、周期性汇总 |
| Memory preview | Codex 可以记住偏好、修正和来之不易的上下文 | 减少每次重新交代项目规则 |
| Context-aware suggestions | Codex 可以建议你从哪里继续 | 让工作台更像“任务收件箱” |
| `/goal` workflows | CLI 0.128.0 加入持久化目标工作流 | 长任务可以被暂停、恢复、清空和继续 |

第三组是 app 工作台体验：

- 可以先开 **Chats**，不用先选项目目录，适合研究、写作、规划和资料整理。
- 任务侧边栏可以展示计划、来源、产物和总结。
- artifact viewer 可以预览 PDF、表格、文档和幻灯片。
- PR review 更深入地进入 app，可以看 GitHub PR、diff 和 review comments。
- 支持多终端、SSH 远程连接 alpha、多窗口、macOS menu bar、Windows system tray、Intel Mac。

这些功能合在一起，改变的是 Codex 的入口位置：它不再只在你需要改文件时出现，而是更像一个能一直挂在旁边的工程工作台。

{% asset_img figure-02.svg %}

## 2. GPT-5.5 进入 Codex：模型能力和产品能力开始同步升级

4 月 23 日，OpenAI 发布 [GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)，并同步让它进入 ChatGPT 和 Codex。Codex changelog 里明确说，GPT-5.5 出现在 model picker 后，是多数 Codex 任务的推荐选择，尤其适合实现、重构、调试、测试、验证和知识工作产物。

这不是单纯换一个更聪明的模型。对 Codex 来说，GPT-5.5 的价值在于它更适合长链路工程任务：

- 能在较大代码系统里保持上下文。
- 更会判断问题应该落在哪个模块。
- 更能主动检查假设，而不是只产出补丁。
- 在生成文档、表格、幻灯片等知识工作上也更强。
- 官方强调它完成同类 Codex 任务时 token 使用更少。

这里有一个值得注意的细节：模型进入 Codex 之后，CLI、IDE extension 和 Codex app 都可以选择它。也就是说，Codex 正在把“同一个 agent harness”铺到多个入口上，而不是每个入口各自发展一套能力。

对用户来说，最直接的变化是：复杂重构、跨文件调试、测试失败分析和长时间验证，应该优先尝试 GPT-5.5。GPT-5.4 仍然可用，但它在这次更新后更像备用选择。

## 3. 桌宠不是玩具：Codex Pets 是一个状态浮层

5 月 1 日，Codex app 文档里出现了 [Codex pets](https://developers.openai.com/codex/app/settings)。它看起来像一个很轻的 UX 彩蛋，但实际承担的是状态提示。

使用方式很简单：

| 入口 | 做什么 |
| --- | --- |
| `/pet` | 在 composer 里唤醒或收起桌宠 |
| `Cmd+K` / `Ctrl+K` | 从命令菜单执行 Wake Pet 或 Tuck Away Pet |
| Settings > Appearance > Pets | 选择内置桌宠，或刷新本地自定义桌宠 |
| `hatch-pet` skill | 生成自己的自定义桌宠 |

官方文档里对它的描述很明确：这个浮层会在你使用其他 app 时保持 Codex 工作可见。它会显示活跃线程，并反映 Codex 当前是运行中、等待输入，还是准备 review。

这个功能有意思的地方在于，它没有增加新的“智能”，但改善了 Agent 常驻时的问题：当一个任务在后台跑，你不一定想一直盯着 Codex 窗口；但你又需要知道它什么时候卡住、什么时候等你批准、什么时候可以 review。

所以 Codex Pets 更像是一个轻量状态栏。它让 Codex 从“窗口里的聊天框”向“桌面上的工作状态”走了一步。

{% asset_img figure-03.svg %}

## 4. CLI 这一个月更新非常密，重点是 Harness 化

如果只用桌面 app，很容易忽略 CLI 的更新。但这个月的 CLI 变化很关键，因为它代表 Codex 的底层 harness 正在被拆成更稳定的基础设施。

按时间看，几个版本的重点是这样的：

| 日期 | 版本 | 值得注意的变化 |
| --- | --- | --- |
| 4 月 10 日 | 0.119.0 | Realtime voice v2、MCP Apps/custom MCP 增强、远程 app-server workflow、按 ID/name resume |
| 4 月 11 日 | 0.120.0 | Realtime V2 可以流式展示后台 Agent 进度，hooks 和 TUI 状态更清晰 |
| 4 月 15 日 | 0.121.0 | `codex marketplace add`、`Ctrl+R` 历史搜索、memory 控制、MCP/plugin 扩展、安全 devcontainer |
| 4 月 20 日 | 0.122.0 | 更完整的 standalone install、`/side` 侧聊、Plan Mode fresh context、插件浏览、deny-read 策略 |
| 4 月 23 日 | 0.124.0 | TUI 快速调 reasoning、多环境 app-server、Bedrock provider、stable hooks、Fast tier 默认 |
| 4 月 30 日 | 0.128.0 | 持久化 `/goal`、`codex update`、可配置 keymap、显式 permission profiles、外部 agent session import |

我觉得最应该单独记住的是三类变化。

第一，**权限和沙箱更细了**。例如 deny-read glob、permission profiles、sandbox CLI profile、trusted workspace、Windows sandbox 修复。这些更新不显眼，但决定了 Codex 能不能在团队里放心跑。

第二，**插件和 MCP 变成基础能力**。`marketplace add`、远程 marketplace、插件安装/卸载、plugin-bundled hooks、MCP Apps、tool search、app integrations，这些都在把 Codex 从单一 Agent 变成工具平台。

第三，**长任务控制更成熟了**。`/goal`、Plan Mode fresh context、side conversations、resume/fork 修复、多环境 app-server、外部 session import，都是围绕“任务不会一次说完、也不会只在一个窗口里完成”这个前提设计的。

还有一个容易漏的点：0.122.0 里 tool discovery 和 image generation 默认启用，并增强了图片细节和 MCP / `js_repl` 图片元数据。这说明 Codex 的工具发现和多模态产物，已经不是边缘能力。

## 5. 插件、Bedrock、企业服务：Codex 在补组织级部署

这个月的另一个主线是企业化。

4 月 16 日的大更新里，OpenAI 提到新增 90 多个插件，覆盖 Atlassian Rovo、CircleCI、CodeRabbit、GitLab Issues、Microsoft Suite、Neon、Render 等。这些插件不是单纯“多几个连接器”，而是把 Codex 放进真实团队已有的工具链里。

4 月 21 日，OpenAI 发布 [Scaling Codex to enterprises worldwide](https://openai.com/index/scaling-codex-to-enterprises-worldwide/)，推出 Codex Labs，并和 Accenture、Capgemini、CGI、Cognizant、Infosys、PwC、TCS 等全球系统集成商合作。这说明 Codex 的目标用户已经不只是个人开发者，也包括希望把 Agent 工作流落到组织流程里的企业。

4 月 28 日，OpenAI 又发布 [OpenAI models, Codex, and Managed Agents come to AWS](https://openai.com/index/openai-on-aws/)。Codex on Bedrock 进入 limited preview，用户可以从 Codex CLI、Codex desktop app 和 VS Code extension 配置 Bedrock 作为 provider。

这对企业客户很重要，因为它解决的是采购、合规、数据处理位置、AWS commit 和现有云基础设施的问题。换句话说，Codex 不只是“能不能帮我写代码”，还要回答“能不能放进我的公司环境里跑”。

{% asset_img figure-04.svg %}

## 6. 计费变化：从消息估算走向 token 明细

4 月 2 日，OpenAI 发布 [Codex now offers pay-as-you-go pricing for teams](https://openai.com/index/codex-flexible-pricing-for-teams/)。Business 和 Enterprise 可以添加 Codex-only seats，不收固定 seat fee，按使用量计费。

同一阶段，Codex 计费口径也从“每条消息大概多少 credits”转向更接近 API 的 token-based rate card。OpenAI Help Center 的 [Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card) 说明：4 月 2 日先覆盖 Plus、Pro、Business 和新的 Enterprise 计划，4 月 23 日扩到现有 Enterprise、Edu、Health、Gov 和 ChatGPT for Teachers。

新的计费表按三类 token 分开：

| 类型 | 为什么重要 |
| --- | --- |
| input tokens | 代码库上下文、提示、工具结果都会进入这里 |
| cached input tokens | 重复上下文如果命中缓存，成本会下降 |
| output tokens | 长补丁、长解释、长报告会显著影响消耗 |

4 月 9 日，ChatGPT release notes 里还新增了 $100/月 Pro 选项，重点面向更长、更高强度的 Codex session，并在限时阶段给到更高 Codex 用量。

这组变化的意义是：Codex 的成本开始更透明，但也更需要用户理解任务形态。输出很长、Fast mode、多实例并行、自动化频繁运行，都会明显改变消耗。

## 7. 安全更新：审批、账号和签名证书都在收紧

Codex 越像一个常驻工作台，安全边界就越重要。这个月有三类更新值得放在一起看。

第一是 **automatic approval reviews**。4 月 23 日的 changelog 里提到，Codex app 可以把符合条件的 approval prompt 先交给自动 reviewer agent。它会展示 review 状态和风险等级，让用户在真正放行前看到更清楚的判断。

第二是账号级安全。4 月 30 日 OpenAI 发布 [Advanced Account Security](https://openai.com/index/advanced-account-security/)。启用后会影响同一登录下的 ChatGPT 和 Codex，包含更强登录方式、更严格恢复路径、更短 session、登录提醒和 session 管理。

第三是 macOS 签名证书轮换。OpenAI 在 [Axios developer tool compromise response](https://openai.com/index/axios-developer-tool-compromise/) 中说明，Codex App 和 Codex CLI 的较老 macOS 版本需要更新到新签名证书版本之后，否则 2026-05-08 之后可能无法正常更新或运行。

这些更新放在一起看，说明 Codex 正在承认一个现实：当 Agent 可以改文件、跑命令、操作浏览器、操作桌面应用时，审批和账号安全不再是附属功能，而是产品核心。

## 8. 我会怎么理解这 30 天

如果把这些更新压缩成一张图，Codex 现在大概有五层。

| 层次 | 最近一个月的代表更新 |
| --- | --- |
| 模型层 | GPT-5.5 进入 Codex，面向长任务和 agentic coding |
| Harness 层 | App Server、多环境、权限 profiles、hooks、MCP、tool discovery |
| 工作台层 | Browser Use、Computer Use、Chats、PR review、artifact viewer、多终端 |
| 长期任务层 | Memory、context-aware suggestions、thread automations、`/goal` |
| 组织层 | token-based pricing、Codex-only seats、Bedrock、Codex Labs、安全能力 |

这也是为什么我觉得“Codex 最近一个月更新了什么”不能只回答功能清单。它真正的方向是：

**Codex 正在从一次性代码生成工具，变成一个能长期留在开发者工作环境里的 Agent 工作台。**

桌宠、状态栏、多窗口、浏览器、自动化、记忆、插件、企业计费，看起来分散，其实都在服务同一个目标：让 Agent 不只回答你一次，而是能在你的一段工作流里持续存在。

## 参考资料

- [Codex changelog](https://developers.openai.com/codex/changelog)
- [Codex app settings: Codex pets](https://developers.openai.com/codex/app/settings)
- [Codex for (almost) everything](https://openai.com/index/codex-for-almost-everything/)
- [Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)
- [Codex now offers pay-as-you-go pricing for teams](https://openai.com/index/codex-flexible-pricing-for-teams/)
- [Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card)
- [OpenAI models, Codex, and Managed Agents come to AWS](https://openai.com/index/openai-on-aws/)
- [Scaling Codex to enterprises worldwide](https://openai.com/index/scaling-codex-to-enterprises-worldwide/)
- [Introducing Advanced Account Security](https://openai.com/index/advanced-account-security/)
- [Our response to the Axios developer tool compromise](https://openai.com/index/axios-developer-tool-compromise/)
