---
title: "Skill 和 MCP 的区别"
date: 2026-04-16 21:45:00
categories:
  - 技术
tags:
  - AI
  - Agent
  - Skill
  - MCP
  - OpenAI
  - Anthropic
excerpt: "基于 OpenAI、Agent Skills 与 MCP 官方资料，系统整理 Skill 和 MCP 的边界、执行路径、组合关系与选型方式，并解释为什么它们不是替代关系，而是经常同时出现的两层能力。"
---

很多人刚接触 agent 体系时，最容易混淆的两个词就是：

- `skill`
- `MCP`

它们经常出现在同一个产品里，也都和 agent 扩展能力有关，所以直觉上很容易把它们看成同一种东西。

但如果把 OpenAI、Agent Skills、MCP 官方资料放在一起看，会得到一个很清晰的结论：

**Skill 和 MCP 不是一层东西。**

为了避免误导，先说明一个边界：

**本文里的对照表和结论，是基于官方资料做的综合归纳，而不是某一家厂商用一段原文直接给出的“唯一标准答案”。**

主要参考资料截至 `2026-04-16`：

- MCP 官方文档：[What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro)
- MCP 官方文档：[Build with Agent Skills](https://modelcontextprotocol.io/docs/develop/build-with-agent-skills)
- Agent Skills：[What are skills?](https://agentskills.io/what-are-skills) / [Specification](https://agentskills.io/specification)
- OpenAI Help Center: [Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt)
- OpenAI Academy: [Skills](https://academy.openai.com/public/resources/skills)
- OpenAI: [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- Simon Willison: [Claude Skills are awesome, maybe a bigger deal than MCP](https://simonwillison.net/2025/Oct/16/claude-skills/)

## 1. 先给结论：Skill 管“怎么做”，MCP 管“怎么连”

{% asset_img figure-01.svg %}

如果把两者的职责压缩到最短：

- `Skill`
  解决的是：**agent 应该按什么方法完成任务**
- `MCP`
  解决的是：**agent 可以连接哪些外部系统、拿到哪些数据、调用哪些能力**

MCP 官方文档把它定义为一种开放标准，用来把 AI 应用连接到外部系统，比如数据源、工具和工作流。

Agent Skills 规范则把 skill 定义为一种轻量的开放格式，用专门知识和工作流来扩展 agent。

所以从对象上看，它们的重心就不同：

- Skill 更偏行为约束和流程指导
- MCP 更偏能力暴露和系统互联

我的归纳是：

**Skill 更像操作手册，MCP 更像标准接口。**

## 2. 两者解决的问题不同

{% asset_img figure-02.svg %}

当你问“到底该用 skill 还是 MCP”时，先不要看技术名词，先看你到底在解决哪一类问题。

### 2.1 Skill 主要解决流程问题

适合 skill 的典型场景是：

- 某件事经常重复做
- 顺序和格式很重要
- 团队有自己的标准
- 即使不接任何外部系统，也依然需要把做法讲清楚

比如：

- 把官方文档整理成固定结构的中文 briefing
- 按团队规范写 changelog
- 按内部 code review 规则做审查
- 按特定模板生成发布说明

这些问题的核心不是“连哪里”，而是“怎么做才算对”。

### 2.2 MCP 主要解决连接问题

适合 MCP 的典型场景是：

- 需要接数据库
- 需要接设计系统
- 需要接项目管理平台
- 需要读本地文件或控制外部服务

比如：

- 连 Figma 取设计稿
- 连 GitHub 取 PR、issue、review 数据
- 连 Notion、Jira、日历、数据库
- 连内部 API 或本地服务

这些问题的核心不是“流程描述”，而是“怎么把外部系统标准化暴露给 agent”。

所以一个实用判断是：

- 如果你缺的是“方法”，优先想 skill
- 如果你缺的是“连接”，优先想 MCP

## 3. 控制权和执行路径也不同

{% asset_img figure-03.svg %}

除了目标不同，二者在执行链路上的位置也不同。

### 3.1 Skill 通过上下文影响模型行为

Skill 一般不会直接变成“新协议”。

它常见的工作方式是：

1. 先靠 `name` 和 `description` 被发现
2. 匹配后加载 `SKILL.md`
3. 再按需读取 `references/`、`assets/` 或执行 `scripts/`

所以它的主要作用机制是：

- 影响模型看到什么信息
- 影响模型怎么规划步骤
- 影响模型输出长什么样

也就是说，skill 更像是在**改变 agent 的做事方法**。

### 3.2 MCP 通过协议暴露外部能力

MCP 则处在另一侧。

它解决的是：

- client 怎么连接 server
- server 怎么暴露工具、资源、提示或应用能力
- agent 怎么用统一协议访问外部系统

所以它的核心机制是：

- 定义连接关系
- 定义能力暴露方式
- 让不同 AI 客户端和不同外部系统之间有统一接口

也就是说，MCP 更像是在**改变 agent 能够接触到的能力面**。

### 3.3 一个很关键的区别

Skill 往往回答：

- 先做什么
- 再做什么
- 什么情况下终止
- 输出该怎么组织

MCP 往往回答：

- 这个系统里有什么数据
- 可以调用哪些工具
- 参数怎么传
- 返回什么结果

一句话说：

**Skill 更关心“决策与步骤”，MCP 更关心“接入与调用”。**

## 4. 为什么它们经常是互补关系

{% asset_img figure-04.svg %}

如果 Skill 和 MCP 是替代关系，那么 MCP 官方文档里就不会专门有一页叫 [Build with Agent Skills](https://modelcontextprotocol.io/docs/develop/build-with-agent-skills)。

这页文档本身已经说明了一件事：

**在真实 agent 体系里，Skill 和 MCP 很适合叠在一起用。**

最常见的组合方式是：

- Skill 负责工作流
- MCP 负责连接外部系统

举几个很典型的组合：

### 4.1 发布助手

- Skill 规定发布说明的结构、校验顺序、风险提示写法
- MCP 连接 GitHub、Jira、CI、监控系统

### 4.2 设计转代码

- Skill 规定如何还原视觉、如何组织组件、如何验收差异
- MCP 连接 Figma 或设计资产系统

### 4.3 研究与写作

- Skill 规定如何筛选权威来源、如何保留日期、如何区分事实与推断
- MCP 连接搜索、知识库、文档系统

从架构上看，这样的分层很自然：

- Skill 提供“做事方法”
- MCP 提供“可用能力”
- Agent 在运行时把两者拼起来

这也是为什么很多成熟系统里，你会同时看到 skills、MCP、plugins、tools，而不是只留一个。

## 5. 什么时候用 Skill，什么时候用 MCP

{% asset_img figure-05.svg %}

如果你只想记一个决策表，就记下面这张。

| 场景 | 更适合 Skill | 更适合 MCP | 最稳妥的做法 |
| --- | --- | --- | --- |
| 团队规范、固定格式、重复流程 | 是 | 否 | 先做 Skill |
| 需要接外部系统取实时数据 | 否 | 是 | 先做 MCP |
| 既要按团队流程做，又要接系统拿数据 | 是 | 是 | Skill + MCP |
| 只是一次性临时请求 | 可能不需要 | 可能不需要 | 先用普通 prompt |
| 需要严格编排、重试、审批、长事务 | 不足够 | 不足够 | 考虑 workflow/orchestrator |

再换一种更直白的问法：

- 你是在教 agent **怎么工作**？
  - 更像 skill
- 你是在给 agent **接入系统**？
  - 更像 MCP
- 你两件事都要？
  - 大概率两者都要

最后给一个容易记住的结论：

**Skill 决定 agent 的“方法论”，MCP 决定 agent 的“连接面”。**

它们不是谁取代谁，而是经常分工合作。

**参考资料**

- [MCP 官方文档：What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro)
- [MCP 官方文档：Build with Agent Skills](https://modelcontextprotocol.io/docs/develop/build-with-agent-skills)
- [Agent Skills: What are skills?](https://agentskills.io/what-are-skills)
- [Agent Skills: Specification](https://agentskills.io/specification)
- [OpenAI Help Center: Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt)
- [OpenAI Academy: Skills](https://academy.openai.com/public/resources/skills)
- [OpenAI: Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [Simon Willison: Claude Skills are awesome, maybe a bigger deal than MCP](https://simonwillison.net/2025/Oct/16/claude-skills/)
