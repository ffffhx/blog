---
title: "什么是 Skill，以及怎么写一个好的 Skill"
date: 2026-04-16 21:30:00
categories:
  - 技术
tags:
  - AI
  - Agent
  - Skill
  - OpenAI
  - Anthropic
  - Agent Skills
excerpt: "基于 OpenAI、Agent Skills 开放规范、Anthropic 与 Microsoft Learn 的官方资料，系统解释什么是 Skill、它是怎么工作的，以及怎样把一个 Skill 写成可发现、可复用、可维护的工作流组件。"
---

很多人第一次看到 `skill`，会把它理解成“模型学会了一个新能力”。

但如果把官方资料放在一起看，你会发现这个理解并不准确。

- OpenAI 在 Help Center 里把 `skill` 解释成 **reusable, shareable workflows**
- Agent Skills 开放规范把它定义为：**一个至少包含 `SKILL.md` 的目录**
- OpenAI Codex 的官方介绍则强调：`skill` 会把 instructions、resources、scripts 打包起来，让 agent 能按团队偏好稳定完成任务

所以更准确的理解是：

**Skill 不是在训练一个新模型，而是在给 agent 提供一份可复用、可按需加载的执行手册。**

本文主要依据以下资料整理，观察时间截至 `2026-04-16`：

- OpenAI Help Center: [Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt)
- OpenAI Academy: [Skills](https://academy.openai.com/public/resources/skills)
- OpenAI: [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- Agent Skills: [What are skills?](https://agentskills.io/what-are-skills) / [Specification](https://agentskills.io/specification)
- Anthropic Docs: [Skill 撰写最佳实践](https://platform.claude.com/docs/zh-TW/agents-and-tools/agent-skills/best-practices)
- Microsoft Learn: [Agent Skills](https://learn.microsoft.com/en-us/agent-framework/agents/skills)

## 1. Skill 到底是什么

{% asset_img figure-01.svg %}

如果只用一句话概括：

**Skill 是把“这件事应该怎么做”封装成一个可复用工作流的格式。**

它通常包含三层东西：

1. `name` 和 `description`
   用来告诉 agent “我是什么、什么时候该用我”。
2. `SKILL.md` 正文
   用来告诉 agent “这件事具体怎么做、顺序是什么、输出长什么样、哪些坑要避开”。
3. 可选资源
   比如 `scripts/`、`references/`、`assets/`，分别承载代码、参考文档、模板素材。

把它和几个经常混淆的概念分开，会更容易理解：

- `prompt`
  一次性请求。它解决的是“我这次想让模型做什么”。
- `tool` 或 `MCP`
  能力入口。它解决的是“模型可以连接什么、调用什么”。
- `skill`
  执行手册。它解决的是“模型应该按什么方法做这件事”。
- `agent`
  执行者。它负责把用户目标、上下文、工具和 skill 组合起来。

从这个角度看，`skill` 更像：

- 团队知识的打包件
- 重复流程的标准化载体
- prompt engineering 的可维护版本

它不是 fine-tuning，也不是模型参数更新，更不是单纯的工具列表。

## 2. 一个 Skill 是怎么工作的

{% asset_img figure-02.svg %}

Agent Skills 规范和 Microsoft Learn 都强调同一个核心机制：`progressive disclosure`，也就是按需加载。

典型过程通常是这样的：

1. 启动时，agent 只预加载每个 skill 的 `name` 和 `description`
2. 当用户任务和某个 skill 的描述匹配时，agent 再读取完整的 `SKILL.md`
3. 只有在正文提到某个参考文档、模板或脚本时，agent 才继续按需读取 `references/`、`assets/` 或执行 `scripts/`

这个设计很重要，因为上下文窗口是共享资源。

如果把所有细节、所有模板、所有脚本说明一开始都塞进提示词，问题会马上出现：

- token 成本会快速升高
- 真实用户请求会被淹没
- agent 反而更不容易选对信息

所以，好的 skill 不是“资料越多越好”，而是“需要的时候才暴露足够的信息”。

这也解释了为什么官方资料普遍建议把 skill 做成小而明确的构件：

- 一个 skill 负责一个清晰场景
- 多阶段任务可以组合多个 skill
- 不要做一个什么都想管的巨型 `万能 skill`

我的归纳是：

**Skill 的运行逻辑，本质上是一种面向 agent 的分层上下文治理。**

它先靠描述完成发现，再靠正文完成执行，再靠资源完成细节补充。

## 3. 怎么写一个好的 Skill

{% asset_img figure-03.svg %}

这一部分最重要。

从 OpenAI Academy、Anthropic 最佳实践和 Agent Skills 规范综合来看，一个好的 skill 至少要同时满足四个标准：

- 它容易被发现
- 它指令足够清楚
- 它上下文成本不过载
- 它在真实任务里稳定可用

### 3.1 先把 `description` 写对

`description` 不是宣传语，而是发现机制的一部分。

Agent 通常先看到的不是正文，而是这个字段。所以这里要同时写清两件事：

- 这个 skill 能做什么
- 什么情况下应该使用它

一个好描述通常会同时包含：

- 任务对象
- 动作
- 触发条件
- 关键术语

比如下面这种写法就更有效：

```yaml
description: Summarize official documentation, release notes, and standards into structured Chinese notes. Use when the user asks for product doc summaries, comparisons, changelog interpretation, or source-linked briefings.
```

它比下面这种模糊写法更好：

```yaml
description: Help with documents.
```

Anthropic 的最佳实践还特别强调两点：

- 用第三人称写
- 具体，且包含关键触发词

因为 agent 不是在“读广告文案”，而是在“做选择”。

### 3.2 正文只写模型本来不知道、但任务又必须知道的内容

Anthropic 的建议里有一句很值得记住的原则：**默认假设模型已经很聪明。**

所以在 `SKILL.md` 正文里，不要重复一堆常识，而要聚焦这几类高价值信息：

- 你团队自己的流程
- 输出格式要求
- 顺序不能乱的步骤
- 易错点和禁止项
- 关键示例

这类内容最值得写进去，因为它们不是通用世界知识，而是任务成功率真正依赖的局部知识。

一个实用的正文结构可以是：

1. `When to use this skill`
2. `Output contract`
3. `Workflow`
4. `Edge cases`
5. `Resources`
6. `Scripts`

如果某件事非常脆弱、顺序必须严格、参数不能乱改，那就要明确写死，而不要让模型自由发挥。

### 3.3 把资源拆到合适的目录里

规范给出的基础目录结构很简单：

```text
my-skill/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

它们适合承载不同类型的信息：

- `SKILL.md`
  放短而关键的规则
- `references/`
  放详细说明、术语表、流程细节
- `assets/`
  放模板、样板文本、示例输出
- `scripts/`
  放真正需要执行的代码

Agent Skills 规范和 Microsoft Learn 都建议资源按需读取，脚本则只在需要时执行。

这意味着你应该把 skill 写成：

- 主体短
- 辅助材料外置
- 路径清楚
- 依赖明确

如果正文已经长到像半篇白皮书，通常说明你还没有把信息分层。

### 3.4 一个好 skill 的检查清单

在真正发布之前，我建议至少过一遍下面这张清单：

- `name` 是否短、清楚、可搜索
- `description` 是否同时说明“做什么”和“什么时候用”
- 正文是否只保留高价值指令，而不是堆基础知识
- 步骤顺序是否明确
- 输出格式是否清楚
- 关键失败场景是否说明
- 脚本行为是否与正文承诺一致
- 参考材料是否按需拆分到了外部目录
- 是否至少用真实任务测过几次

## 4. 一个可直接复用的 Skill 模板

{% asset_img figure-04.svg %}

如果你想从零开始写一个 skill，下面这个最小模板基本够用。

目录结构：

```text
summarizing-official-docs/
├── SKILL.md
├── references/
│   └── source-checklist.md
├── assets/
│   └── output-template.md
└── scripts/
    └── collect-links.sh
```

`SKILL.md` 示例：

```md
---
name: summarizing-official-docs
description: Summarize official documentation, release notes, and standards into structured Chinese notes. Use when the user asks for product doc summaries, release-note interpretation, standards comparison, or source-linked briefings.
---

# Summarizing Official Docs

## When to use this skill
Use this skill when the task requires reading official product documentation,
release notes, standards pages, or help-center articles and turning them into
clear Chinese summaries with source links.

## Output contract
- Start with a short executive summary.
- Keep exact product names and exact dates.
- Separate source-backed facts from inference.
- End with a flat source list.

## Workflow
1. Prefer official documentation and standards pages.
2. If multiple official pages exist, prioritize the newest one.
3. Extract definitions, scope, limitations, and dates.
4. Summarize in Chinese for fast reading.
5. Mark any synthesis or inference explicitly.

## Edge cases
- If official sources conflict, surface the conflict instead of guessing.
- If information is outdated or incomplete, say so clearly.

## Resources
- Read [source-checklist](references/source-checklist.md) before finalizing.
- Use [output-template](assets/output-template.md) when the user wants a full article.

## Scripts
When collecting links from a known list, run:
scripts/collect-links.sh
```

这个模板的重点不是格式本身，而是它体现了一个好的 skill 写法：

- 元数据负责发现
- 正文负责规则
- 外部资源负责细节
- 脚本负责执行

如果你的 skill 还需要限制工具范围，可以在你的具体 agent 实现支持的前提下，再加入类似 `allowed-tools` 之类的扩展字段。这里要注意：**这类字段通常属于实现扩展，不一定是所有客户端都通用的核心标准。**

## 5. 常见错误与迭代方法

{% asset_img figure-05.svg %}

大多数写坏的 skill，问题都不是“模型不够强”，而是作者把边界写糊了。

最常见的错误有五类：

### 5.1 描述太泛

例如：

- `helper`
- `tools`
- `research`

这类名字和描述几乎不告诉 agent 任何选择信号，结果就是 skill 不容易被命中，或者被乱命中。

### 5.2 正文太长，像一份培训文档

如果 `SKILL.md` 里全是背景知识、概念科普、重复解释，说明你把上下文预算浪费在了低价值信息上。

Microsoft Learn 建议把 `SKILL.md` 控制在较短范围内，把详细材料放到单独资源文件里；Anthropic 也反复强调“简洁是关键”。

### 5.3 一个 skill 想做所有事

比如既想负责“数据清洗”，又想负责“图表制作”，又想负责“汇报文案”，又想负责“邮件发送”。

这通常会带来三个问题：

- 描述越来越模糊
- 正文越来越长
- 成功标准越来越不一致

更稳妥的方式通常是拆成多个小 skill，再由 agent 在任务里组合使用。

### 5.4 脚本和说明不一致

正文说“只读”，脚本却会写文件。

正文说“先校验再执行”，脚本却直接修改。

这种错最危险，因为它会让 skill 从“工作流说明”退化成“不可预测的黑箱”。

### 5.5 没有用真实任务测试

Anthropic 的最佳实践明确建议：用你计划实际使用的模型去测试 skill。

我会建议把测试做成一个简单闭环：

1. 挑 5 到 10 个真实任务
2. 观察 skill 是否会被正确命中
3. 看输出是否稳定符合预期
4. 把失败案例回写到 `description`、正文或示例里

一个 skill 是否好，不是看它写得多漂亮，而是看它在真实上下文里是否稳定工作。

最后把本文压成一句话：

**好 skill 的本质，不是“内容很多”，而是“让 agent 在对的时机，加载对的信息，并按对的方法完成任务”。**

**参考资料**

- [OpenAI Help Center: Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt)
- [OpenAI Academy: Skills](https://academy.openai.com/public/resources/skills)
- [OpenAI: Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [Agent Skills: What are skills?](https://agentskills.io/what-are-skills)
- [Agent Skills: Specification](https://agentskills.io/specification)
- [Anthropic Docs: Skill 撰写最佳实践](https://platform.claude.com/docs/zh-TW/agents-and-tools/agent-skills/best-practices)
- [Microsoft Learn: Agent Skills](https://learn.microsoft.com/en-us/agent-framework/agents/skills)
