---
title: "lark-cli 源码解析：一个面向 AI Agent 的命令平台，是怎么把命令、鉴权、MCP 和 Skills 组织起来的"
date: 2026-04-17 00:20:00
categories:
  - 技术
tags:
  - AI
  - Agent
  - CLI
  - Go
  - Lark
  - Feishu
  - 源码解析
  - 平台架构
excerpt: "从普通 CLI 和 agent-native CLI 的差别讲起，拆解 larksuite/cli 的三层命令体系、启动装配、元数据驱动命令、shortcut 框架、鉴权链路、MCP/Skills 设计与工程化测试策略。"
---

## 摘要

先用一句人话说清楚：`lark-cli` 是 Lark / 飞书官方开源的命令行工具，你可以把它理解成“把飞书能力统一搬到终端里的入口层”。它一头连着 Calendar、Docs、IM、Mail、Base、Sheets 等业务能力，另一头连着开发者脚本、自动化流程和 AI Agent 的执行链路。

它主要拿来做三类事情：

- 给人类用户一个统一的终端入口，快速完成查日程、读写文档、收发消息、操作表格、查询会议等高频动作
- 给脚本和工程系统一个稳定接口，把飞书能力接进批处理任务、流水线、内部平台或自动化工作流
- 给 AI Agent 一套结构化、可鉴权、可判错、可继续执行的工具接口，而不是让模型自己去猜网页流程或手拼 API 请求

对应地，它最适合出现的场景也很明确：

- 你本来就在飞书生态里做开发，希望用一个 CLI 收口大量 OpenAPI 能力
- 你在写自动化脚本、MCP 工具或者内部效率平台，不想自己重复造鉴权、参数解析和输出规范这些轮子
- 你在给 Agent 搭工具链，希望模型调用的是“稳定命令接口”，而不是脆弱的浏览器点击流

最近我花了一些时间看 [larksuite/cli](https://github.com/larksuite/cli) 这个仓库。

如果只看 README，你很容易先记住这些标签：

- Lark / 飞书官方 CLI
- 用 Go 写的命令行工具
- 覆盖 Calendar、Docs、IM、Mail、Base、Sheets 等大量业务域
- 支持 `Shortcuts`、`API Commands`、`Raw API`
- 还专门给 AI Agent 提供了一整套 `Skills`

但真正进源码以后，我觉得它最值得看的地方不是“命令很多”，而是下面这件事：

**它不是把 OpenAPI 生硬包成命令，而是在做一个面向 AI Agent 的命令平台。**

这句话说得再直白一点就是：

- 普通 CLI 的重点，通常是“人类用户好不好敲”
- `lark-cli` 的重点，除了“人好不好敲”，还包括“Agent 好不好调、好不好判错、好不好继续下一步”

所以，这个仓库真正有意思的地方，在于它同时处理了几件事：

- 给人类准备高频快捷命令
- 给平台 API 准备可扩展的元数据驱动命令
- 给 AI Agent 准备结构化输出、权限提示、技能文档和 MCP 接入

这篇文章会按下面这条主线展开：

1. 先把文中几个容易陌生的词讲清楚
1. 再解释为什么它不能只被看成“普通 CLI”
1. 然后拆开它的三层命令系统
1. 接着看程序启动时是怎么把这些能力装配起来的
1. 再看元数据驱动命令和 shortcut 框架各自解决什么问题
1. 然后重点分析鉴权、身份和 strict mode
1. 再解释它为什么对 AI Agent 特别友好
1. 最后补上工程化与测试策略

为了避免版本漂移，先说明本文的观察范围：

- 仓库：[larksuite/cli](https://github.com/larksuite/cli)
- 分支：`main`
- 阅读快照：`6ad25cd452b4ded6951c232eba41c993c92534f8`
- 观察时间：`2026-04-17`

另外，下面所有代码片段都是**裁剪版源码片段**：

- 只保留表达设计意图的主体逻辑
- 去掉了很多边界分支、日志和细节处理
- 目的是让没接触过 Go 的读者，也能先看懂“它到底想怎么组织系统”

## 阅读预备：先把几个容易陌生的词说人话

{% asset_img figure-01.svg %}

正式开始之前，先把文中会反复出现的几个词讲清楚。

- `Cobra`
  - Go 生态里很常见的 CLI 框架，可以理解成“帮你搭命令树、参数、帮助信息和补全的工具箱”
- `Shortcut`
  - 对高频场景做的一层人工封装。它不是平台原生 API 名字，而是更偏用户语言的快捷命令
- `Registry Meta`
  - 一份 API 描述数据。里面会写某个服务有哪些资源、有哪些方法、参数是什么、支持什么身份
- `Device Flow`
  - 一种授权流程。CLI 先拿到一个链接和设备码，用户去浏览器确认，CLI 再继续轮询拿 token
- `MCP`
  - `Model Context Protocol`，可以简单理解成“让 Agent 接外部工具和资源的统一协议”
- `Skill`
  - 给 Agent 的“工作说明书”或“经验模板”，告诉它这个领域应该怎么做、先做什么、后做什么
- `Strict Mode`
  - 对身份做硬约束的模式。比如某个环境只允许 `bot` 身份，那就算你传了 `--as user` 也不会放行

如果你先记住一句话，后面会轻松很多：

**`lark-cli` 不是只在管理命令，它其实在管理“能力层、身份层、输出层和 agent 协作层”。**

## 1. 先别把它看成普通 CLI

{% asset_img figure-02.svg %}

我觉得读这个仓库时，第一步就要把视角摆正：

**它不是“一个支持很多命令的工具”，而是“一个给人和 Agent 共用的命令平台”。**

这个判断不是我硬拔高，而是仓库自己就写得很明确。

README 一开头就把它定义成：

- 官方 CLI
- built for humans and AI Agents
- 三层命令系统
- 自带 22 个 Skills

换句话说，它从设计目标上就和很多普通 CLI 不一样。

普通 CLI 最常见的优化目标，是这些问题：

- 参数是不是足够短
- 帮助信息是不是够清楚
- 终端输出是不是够友好

但 `lark-cli` 额外还要处理这些问题：

- Agent 能不能稳定判断成功和失败
- Agent 出错后能不能自动继续下一步
- Agent 能不能先 dry-run 再执行
- Agent 能不能知道这条命令支持 `user` 还是 `bot`
- Agent 在权限不够时，能不能拿到结构化 hint，而不是一段模糊报错

这也是为什么仓库里的 `AGENTS.md` 会把话说得这么直：

- 这个 CLI 的主要用户之一就是 AI agents
- 每一条错误信息都可能被 Agent 当成下一步行动依据
- `stdout` 是数据，`stderr` 是提示，不能乱混

所以你会发现，这个项目的很多设计，表面看像“实现细节”，其实背后都在服务一个核心目标：

**把命令行从“人类手敲工具”升级成“Agent 可组合调用的执行接口”。**

## 2. 先看全景图：为什么它要做三层命令系统

{% asset_img figure-03.svg %}

这个仓库最应该先理解的，不是哪一个目录，而是它的三层命令系统：

1. `Shortcuts`
1. `API Commands`
1. `Raw API`

这三层不是重复造轮子，而是在解决三类不同的问题。

### 2.1 第一层：Shortcuts

这一层最接近“用户想做什么”。

比如你想看今天日程，你不一定想先去猜平台 API 的资源名、方法名和参数结构；你真正想说的是：

- 看我今天的日程
- 发一条消息
- 创建一篇文档

于是 `lark-cli` 提供了像下面这样的命令：

- `calendar +agenda`
- `im +messages-send`
- `docs +create`

这一层的特点是：

- 命令名字更像用户语言
- 参数通常更短
- 能带默认值、格式化输出、dry-run
- 适合高频场景

### 2.2 第二层：API Commands

这一层更接近平台官方 API。

比如：

- `calendar events instance_view`
- `calendar calendars list`

它们的核心价值不是“更好记”，而是：

- 和平台 schema 接近
- 能快速覆盖大量服务
- 当 shortcut 还没封装时，也有一条结构化调用路径

### 2.3 第三层：Raw API

这一层是最后的兜底：

- `lark-cli api GET /open-apis/...`

它的意义很明确：

- 不要求平台每个 API 都先被封装成命令
- 不要求每个命令都提前做产品化设计
- 只要底层 OpenAPI 在，就有一条原始调用路径

所以这三层的分工可以理解成：

- `Shortcuts` 解决高频体验
- `API Commands` 解决规模化覆盖
- `Raw API` 解决绝对兜底

这其实就是一种很典型的平台设计思路：

**上层做体验，中层做规模，下层做保底。**

## 3. 程序启动时，到底装配了什么

{% asset_img figure-04.svg %}

理解完三层命令系统，再去看代码就顺很多了。

程序入口很薄，真正关键的是装配过程。

先看裁剪后的入口代码，对应源码里的 [`main.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/main.go)：

```go
package main // 这是 Go 程序的主包

import ( // 引入本文件需要的依赖
    "os" // 标准库，用来设置进程退出码
    "github.com/larksuite/cli/cmd" // 真正的命令装配入口在这里
    _ "github.com/larksuite/cli/extension/credential/env" // 仅为了触发 init，注册环境变量凭证提供方
) // 导入结束

func main() { // 程序入口函数
    os.Exit(cmd.Execute()) // 把控制权交给 cmd 层，并把返回值作为退出码
} // 入口结束
```

这个入口几乎不做业务逻辑，说明作者刻意把“启动”和“装配”分离开了。

真正的重点在 [`cmd/root.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/cmd/root.go)：

```go
f := cmdutil.NewDefault(inv) // 先创建一个默认 Factory，把配置、客户端、凭证等依赖集中起来

rootCmd.AddCommand(cmdconfig.NewCmdConfig(f)) // 注册配置相关命令
rootCmd.AddCommand(auth.NewCmdAuth(f)) // 注册鉴权相关命令
rootCmd.AddCommand(api.NewCmdApi(f, nil)) // 注册 raw api 命令
rootCmd.AddCommand(schema.NewCmdSchema(f, nil)) // 注册 schema 查看命令
service.RegisterServiceCommands(rootCmd, f) // 注册基于元数据自动生成的 API Commands
shortcuts.RegisterShortcuts(rootCmd, f) // 注册人工封装的高频 shortcuts

if mode := f.ResolveStrictMode(context.Background()); mode.IsActive() { // 如果当前环境开启了 strict mode
    pruneForStrictMode(rootCmd, mode) // 就把不允许的命令从命令树里裁掉
} // 裁剪逻辑结束
```

这段代码其实把全仓库的骨架都说清楚了：

### 3.1 它先建的是 Factory，而不是客户端

这说明作者不想在各个命令里手动到处 new：

- 配置
- HTTP client
- Lark SDK client
- credential provider

而是先把这些依赖集中到一个工厂对象里，再注入给所有命令。

这样做的好处很明显：

- 各命令代码更短
- 测试时更容易 stub
- identity、config、client 的创建逻辑不会散在各处

### 3.2 命令树是“固定命令 + 动态命令 + shortcuts”拼出来的

也就是说，根命令并不是一次性手写完全部结构，而是分三批装配：

- 手写固定命令
- 根据 registry 元数据生成 API 命令
- 根据 shortcut 声明挂载高频快捷命令

### 3.3 strict mode 不是执行时才拦，而是启动时就裁树

这一点很关键。

很多系统会在命令执行时才说“不允许”，但 `lark-cli` 更进一步：

- 如果当前环境只允许 `bot`
- 那就直接把不兼容命令从命令树里裁掉

这会让：

- 帮助信息更准确
- 自动补全更准确
- Agent 更少走弯路

所以从启动链路就能看出来，这个项目的设计思路非常清晰：

**先把运行时依赖装好，再把命令树按角色分层挂上去，最后按环境约束做一轮剪枝。**

## 4. 为什么它能靠元数据扩出大量 API 命令

{% asset_img figure-05.svg %}

如果这个项目要手写所有平台 API 命令，维护成本会很快失控。

所以它选择了一条更平台化的路：

**命令不是手写出来的，而是从元数据“展开”出来的。**

对应源码里的 [`cmd/service/service.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/cmd/service/service.go)：

```go
for _, project := range registry.ListFromMetaProjects() { // 遍历所有服务名
    spec := registry.LoadFromMeta(project) // 读取这个服务的元数据
    if spec == nil { // 如果没有读到元数据
        continue // 就直接跳过
    } // 空元数据处理结束

    resources, _ := spec["resources"].(map[string]interface{}) // 取出这个服务下面的资源集合
    registerService(parent, spec, resources, f) // 把这份元数据展开成真正的命令树
} // 遍历结束
```

这个设计的意思其实很朴素：

- 平台 API 的结构，本来就是数据
- 那 CLI 命令树也可以从这份数据生成

这样一来，新增服务时就不一定要先写命令代码，很多时候只要：

1. 更新元数据
1. 重新加载 registry
1. 命令树就能自动长出来

### 4.1 元数据本身也不是死的

`registry` 这一层更有意思，它不是只读本地文件。

从 [`internal/registry/loader.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/internal/registry/loader.go) 和 [`internal/registry/remote.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/internal/registry/remote.go) 可以看出，它大概是这条思路：

- 编译时把一份 `meta_data.json` embed 进二进制，作为基线
- 运行时如果允许，就去远端拉更新版元数据
- 结果写本地 cache
- 再把远端数据 overlay 到内置基线上

这解决了一个很现实的问题：

**CLI 的发布节奏，通常追不上平台 API 的变化节奏。**

如果完全靠重新发版同步 API，很容易滞后；但如果完全依赖在线拉取，又会影响首启可用性和离线可靠性。

所以它折中成了：

- 内置一份“至少可用”的静态快照
- 再叠一层“尽量新鲜”的远端更新

这是一个很典型、也很实用的平台化取舍。

### 4.2 元数据驱动命令，不只是省代码

很多人第一次看到这种设计，会以为它只是“偷懒少写代码”。

其实更重要的价值是统一。

因为一旦 schema 统一，下面这些能力都更容易统一生成：

- `--params`
- `--data`
- `--file`
- 身份校验
- scope 校验
- `schema` 帮助命令
- 自动补全

所以它省下来的不只是“某个命令函数”，而是整套配套能力的重复开发。

## 5. 为什么高频场景还要再包一层 Shortcut

{% asset_img figure-06.svg %}

如果已经有 API Commands 了，为什么还要再做 `Shortcuts`？

答案其实很简单：

**因为“能调 API”不等于“高频任务好用”。**

举个例子。

用户想看的不是：

- `calendar events instance_view --params ...`

用户真正想说的是：

- “看我今天的日程”

所以 `Shortcut` 这一层，解决的是 API 命令不擅长的事：

- 默认值
- 场景语义
- 更短的参数
- 更像人话的名字
- 更友好的输出
- dry-run

先看一个 shortcut 声明，对应源码里的 [`shortcuts/calendar/calendar_agenda.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/shortcuts/calendar/calendar_agenda.go)：

```go
var CalendarAgenda = common.Shortcut{ // 声明一个高频快捷命令
    Service: "calendar", // 它会挂到 calendar 服务下面
    Command: "+agenda", // 命令名字是 +agenda
    Scopes: []string{"calendar:calendar.event:read"}, // 执行它需要这个读权限
    AuthTypes: []string{"user", "bot"}, // user 和 bot 两种身份都允许
    HasFormat: true, // 框架会自动给它挂上 --format
    Execute: func(ctx context.Context, runtime *common.RuntimeContext) error { // 这里才是真正的业务逻辑入口
        items, err := fetchAgenda(runtime) // 先把日程数据拉回来
        if err != nil { // 如果拉取失败
            return err // 直接交给统一错误系统处理
        } // 错误处理结束
        runtime.OutFormat(items, &output.Meta{Count: len(items)}, prettyAgenda) // 再交给统一输出层格式化返回
        return nil // 正常结束
    }, // 业务逻辑结束
} // shortcut 声明结束
```

这个声明式结构很值得学，因为它把 shortcut 需要的关键信息都显式摆出来了：

- 这个命令属于哪个 service
- 命令名是什么
- 需要什么 scope
- 支持什么身份
- 是否支持格式化输出
- 真正执行逻辑是什么

换句话说，它不是先写一堆命令代码，再靠读代码猜约束；而是先把约束写成数据，再把执行逻辑挂进去。

### 5.1 真正厉害的地方，在统一执行流水线

`Shortcut` 之所以好维护，不只是因为用了一个 struct，而是因为所有 shortcut 都能走同一条执行流水线。

对应源码里的 [`shortcuts/common/runner.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/shortcuts/common/runner.go)：

```go
as, err := resolveShortcutIdentity(cmd, f, s) // 第一步，先确定当前到底用 user 还是 bot 身份
config, err := f.Config() // 第二步，再加载当前配置
if err := checkShortcutScopes(f, cmd.Context(), as, config, s.ScopesForIdentity(string(as))); err != nil { // 第三步，本地预检查 scope
    return err // 权限不够就提前返回
} // scope 预检查结束

rctx, err := newRuntimeContext(cmd, f, s, config, as, botOnly) // 第四步，组装运行时上下文
if err := resolveInputFlags(rctx, s.Flags); err != nil { // 第五步，解析 @file 和 stdin 这种输入形式
    return err // 输入不合法就返回
} // 输入解析结束

if rctx.Bool("dry-run") { // 如果用户要求 dry-run
    return handleShortcutDryRun(f, rctx, s) // 就只输出“将要做什么”
} // dry-run 分支结束

return s.Execute(rctx.ctx, rctx) // 最后才真正执行业务逻辑
```

这条流水线特别像“一个小型框架”。

它把 shortcut 的公共问题都提前收口了：

- 身份解析
- strict mode
- scope 检查
- 输入解析
- dry-run
- 风险确认
- 输出协议

于是具体业务代码就可以更聚焦在：

- 这条命令到底要做什么

这正是框架层最应该做的事：

**把所有横切逻辑吃掉，让业务代码只关心业务。**

## 6. 鉴权为什么是核心骨架，而不是边角料

{% asset_img figure-07.svg %}

很多 CLI 项目把鉴权当成一个“工具模块”。

但在 `lark-cli` 里，鉴权其实更像系统骨架，因为它直接决定：

- 当前命令能不能执行
- 用 `user` 还是 `bot`
- strict mode 是否生效
- scope 是否满足
- 输出里应该带什么提示

先看它的 credential provider 思路，对应 [`internal/credential/credential_provider.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/internal/credential/credential_provider.go)：

```go
for _, prov := range p.providers { // 先按顺序尝试所有扩展凭证提供方
    acct, err := prov.ResolveAccount(ctx) // 让扩展自己提供账号信息
    if err != nil { // 如果扩展报错
        return nil, err // 就把错误抛出去
    } // 扩展报错处理结束
    if acct != nil { // 只要有一个扩展命中了
        p.selectedSource = extensionTokenSource{provider: prov} // 记录后续 token 应该从哪个扩展拿
        return convertAccount(acct), nil // 转成内部结构并返回
    } // 扩展命中处理结束
} // 扩展遍历结束

acct, err := p.defaultAcct.ResolveAccount(ctx) // 如果扩展都没命中，就回退到默认配置来源
p.selectedSource = defaultTokenSource{resolver: p.defaultToken} // 同时记录默认 token 来源
return acct, err // 返回默认结果
```

这段代码背后体现的是很明确的优先级策略：

- 先给扩展留入口
- 没有扩展结果时，再回退本地默认配置

### 6.1 这不是单纯的 token 存取，而是身份决策链

这个 provider chain 后面还会继续影响很多东西：

- `DefaultAs`
- 自动推断 `AutoAs`
- 当前环境支持哪些身份
- strict mode 是否只允许 `user` 或 `bot`

所以它不是“拿到 token 就完了”，而是在决定整条命令的执行身份。

### 6.2 login 的 device flow 也明显在为 Agent 场景优化

对应 [`cmd/auth/login.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/cmd/auth/login.go) 的 `--no-wait` 分支，大意可以裁成这样：

```go
if opts.NoWait { // 如果是 agent 更喜欢的非阻塞模式
    data := map[string]interface{}{ // 就构造一段结构化返回值
        "verification_url": authResp.VerificationUriComplete, // 把真正要给用户打开的授权链接返回出去
        "device_code": authResp.DeviceCode, // 把设备码也一并返回，方便后续继续轮询
        "expires_in": authResp.ExpiresIn, // 告诉调用方这段授权还能维持多久
        "hint": "先展示链接，再继续轮询，不要让用户自己敲命令", // 明确告诉 Agent 下一步应该怎么做
    } // 结构化数据准备完成
    encoder.Encode(data) // 直接输出 JSON，方便机器解析
    return nil // 这一轮先结束
} // no-wait 分支结束
```

如果这是一个只服务人类用户的 CLI，它完全可以只输出一段自然语言：

- “请复制这个链接到浏览器打开”

但 `lark-cli` 没这么做，而是把：

- 链接
- 设备码
- 过期时间
- 下一步提示

都做成了结构化字段。

这就意味着 Agent 可以非常稳定地做下面这些动作：

1. 读出 `verification_url`
1. 展示给用户
1. 记住 `device_code`
1. 再用另一个流程继续轮询

这就是典型的 agent-native 设计：**不是让 Agent“看懂一句话”，而是直接给 Agent“下一步要用的数据”。**

## 7. 它为什么对 AI Agent 特别友好：结构化输出、MCP、Skills

{% asset_img figure-08.svg %}

如果让我只挑一个最能代表这个仓库气质的点，我会选：

**它非常认真地在做“机器可消费的命令行接口”。**

### 7.1 成功和失败都走统一 envelope

对应 [`internal/output/envelope.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/internal/output/envelope.go)：

```go
type Envelope struct { // 统一的成功响应结构
    OK bool `json:"ok"` // 这次请求是否成功
    Identity string `json:"identity,omitempty"` // 这次到底是 user 还是 bot 在执行
    Data interface{} `json:"data,omitempty"` // 真正的业务结果放在这里
    Meta *Meta `json:"meta,omitempty"` // count 之类的附加信息放在这里
    Notice map[string]interface{} `json:"_notice,omitempty"` // 更新提醒等系统提示也能挂在这里
} // 成功响应结构结束
```

对应 [`internal/output/errors.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/internal/output/errors.go) 的错误输出，也是一套统一结构。

这意味着 Agent 在调用命令后，不需要每次都用正则去猜：

- 成功是不是包含某个单词
- 错误是不是一段固定文案

它只要看：

- `ok`
- `error.type`
- `error.message`
- `error.hint`

就能决定下一步。

### 7.2 有些能力不是走 OpenAPI，而是直接走 MCP

这点也很有意思。

比如 `docs +create`，源码里的裁剪逻辑大概是这样，对应 [`shortcuts/doc/docs_create.go`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/shortcuts/doc/docs_create.go)：

```go
args := buildDocsCreateArgs(runtime) // 先把命令行参数整理成 create-doc 需要的入参
result, err := common.CallMCPTool(runtime, "create-doc", args) // 再通过 MCP 工具去创建文档
if err != nil { // 如果 MCP 调用失败
    return err // 继续交给统一错误系统处理
} // 错误处理结束
runtime.Out(result, nil) // 成功后仍旧走统一输出协议
return nil // 命令正常结束
```

这说明它的思路不是：

- “所有能力都必须落成某种 API 命令”

而是：

- 哪条路径更适合，就走哪条路径
- 但无论底层走 OpenAPI 还是 MCP，外层体验和输出协议尽量统一

这点非常重要，因为真实平台往往不是一个协议打天下：

- 一些能力更像 OpenAPI
- 一些能力更像工具调用
- 一些能力更适合 workflow 封装

而 `lark-cli` 做的是把这些差异吸到内部，不把混乱直接暴露给用户和 Agent。

### 7.3 Skills 则是在“调用接口”之外，再补一层“做事方法”

仓库里单独有一整个 `skills/` 目录，而且 skill 文档写得很重。

这说明作者很清楚一件事：

**即使接口统一了，Agent 也不一定天然知道某个业务域应该按什么顺序做。**

比如日历领域里：

- 什么时候先查 freebusy
- 什么时候先给候选时间
- 什么时候必须等用户确认

这些不是纯 API 参数问题，而是业务工作流问题。

所以 `skills/` 解决的并不是“怎么连系统”，而是：

- 这个领域该怎么做才更稳
- 哪些步骤不能跳
- 哪些 shortcut 应该优先用

这里还要特别澄清一个很容易混淆的点：

**`Skill` 不是 `CLI` 本体，也不是另一套命令系统；它更像是建立在 `CLI` 之上的 Agent 使用说明层。**

比如像 `lark-calendar`、`lark-mail`、`lark-contact`、`lark-im` 这些名字，从职责上说都更接近“领域 skill”：

- 它们告诉 Agent 这个领域优先用哪些命令
- 告诉 Agent 遇到什么情况要先检查前置条件
- 告诉 Agent 哪些步骤必须等用户确认

但真正执行动作的，仍然是底层的 `lark-cli` 命令、shortcut，或者它暴露出来的 MCP 能力。

如果一定要把这几层关系压缩成一句话，可以这么记：

- `lark-cli` 是执行引擎
- `calendar +agenda`、`mail ...` 这类是具体调用入口
- `lark-calendar`、`lark-mail` 这类是给 Agent 的领域工作流说明书

再往下一层看，如果某个 skill 目录里还有 `scripts/`，那它和 `skill` 本体也不是一回事。

这里可以把两者理解成：

- `skill` 负责定义“这类任务应该怎么做”
- `skill` 里的 `scripts/` 负责把其中重复、机械、适合程序化的步骤自动化

也就是说，`skill` 回答的是：

- 先做什么
- 后做什么
- 哪些步骤必须确认
- 哪些命令应该优先用

而 `skill/scripts` 回答的是：

- 某个中间步骤怎么更省事地执行
- 某个模板怎么自动生成
- 某种数据怎么批量整理或转换

所以 `skill` 更像“作业流程说明”，`scripts/` 更像“这套流程里顺手配的内部小工具”。

它们的边界可以这样记：

- 没有 `scripts/`，`skill` 依然成立，因为它首先是一份工作流知识
- 没有 `skill`，单独的 `scripts/` 往往只剩下技术动作，不知道该在什么时机使用
- `scripts/` 不是新的用户入口，也不会替代 `lark-cli` 这样的执行接口

如果要用一个更直观的类比：

- `skill` 像值班手册
- `scripts/` 像手册里附带的几个小工具

也就是说，在这个仓库里：

- `Commands` 给调用入口
- `MCP` 给额外能力
- `Skills` 给领域工作流

三者叠在一起，才构成一个真正适合 Agent 的使用面。

## 8. 工程化怎么兜底：构建、发布、测试

{% asset_img figure-09.svg %}

如果前面几章讲的是“架构怎么设计”，那最后这一章讲的就是：

**这套东西怎么才能长期维护，而不是写着写着失控。**

### 8.1 构建流程里已经把元数据同步考虑进去了

对应 [`Makefile`](https://github.com/larksuite/cli/blob/6ad25cd452b4ded6951c232eba41c993c92534f8/Makefile)：

```makefile
fetch_meta: # 先定义一个抓取元数据的步骤
	python3 scripts/fetch_meta.py # 从远端拉取最新 API 元数据并落到本地

build: fetch_meta # 真正构建之前，先确保元数据已经准备好
	go build -trimpath -ldflags "$(LDFLAGS)" -o $(BINARY) . # 再去编译 CLI 二进制

unit-test: fetch_meta # 跑单测之前，同样先准备元数据
	go test -race -gcflags="all=-N -l" -count=1 ./cmd/... ./internal/... ./shortcuts/... # 跑核心模块测试

integration-test: build # 集成测试依赖已经构建好的 CLI
	go test -v -count=1 ./tests/... # 从用户视角执行端到端测试
```

这个顺序很有代表性，因为它明确承认了一件事：

**元数据不是可有可无的附属品，而是系统本身的一部分。**

### 8.2 仓库专门把 Agent 使用规范写进了 AGENTS.md

我很喜欢 `AGENTS.md` 里的一个态度：

- 不只是说“请写测试”
- 而是直接告诉贡献者：这个 CLI 的主要用户之一就是 Agent

于是它进一步规定：

- `RunE` 不能随便 `fmt.Errorf`
- 错误要结构化
- `stdout` 和 `stderr` 不能混
- shortcut 改动要补 dry-run E2E

这其实相当于把“Agent 可调用性”提升成了工程规范，而不是个人风格。

### 8.3 测试策略也是分层的

从 `tests/cli_e2e` 目录和 `AGENTS.md` 可以看出，它大致有三层测试观念：

- 单元测试：验证模块逻辑
- dry-run E2E：不碰真实 API，但验证命令结构、参数和请求意图
- live E2E：真的走 API，验证完整往返

这套测试设计很适合 CLI 平台项目，因为它能同时覆盖：

- 框架行为
- 命令协议
- 真实集成

而且 dry-run E2E 对 Agent 场景尤其重要。

因为对 Agent 来说，“请求结构是不是对的”很多时候比“终端文案好不好看”更关键。

## 最后总结：这套设计最值得学什么

如果让我把整篇文章压缩成几句话，我会这样总结：

### 第一，它不是只在做命令，而是在做分层

- `Shortcuts` 面向任务
- `API Commands` 面向平台
- `Raw API` 面向兜底

这让它同时兼顾了体验、覆盖率和灵活性。

### 第二，它不是把鉴权当插件，而是当骨架

- `user / bot / auto`
- provider chain
- strict mode
- scope pre-check

这些东西并不是边角料，而是每条命令执行前的必经之路。

### 第三，它真的把 Agent 当一等用户

这体现在很多小地方：

- 统一 envelope
- 结构化错误和 hint
- `--no-wait` 授权模式
- dry-run
- skills
- MCP 接入

单独看每一点都不算惊人，但合在一起，就形成了一种很清晰的产品气质：

**这不是“给人用，顺便也许 Agent 能凑合用”的 CLI。**

**这是“从一开始就认真考虑 Agent 怎么稳定调用”的 CLI。**

我觉得这也是 `lark-cli` 最值得学习的地方。

它真正厉害的地方，不是支持了多少命令，而是把下面这件事做得很完整：

**如何把平台 API、运行时依赖、身份系统、结构化输出、MCP 和 Skills 组织成一个长期可维护的命令平台。**

如果你以后也想做：

- 某个 SaaS 产品的官方 CLI
- 某个内部平台的 Agent 执行层
- 某种“既给人用也给模型用”的命令接口

那这个仓库真的很值得认真读一遍。
