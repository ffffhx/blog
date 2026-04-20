# Workflow Checklist

Use this checklist when writing a new technical article for this repo.

## 1. Confirm the target

- Is this a new post or an update?
- Is the topic a repository, framework, tool, workflow, or technical problem?
- If it is a repository analysis:
  - capture the repository URL
  - capture the observed branch
  - capture the observed commit hash
  - capture the observation date

## 2. Read the source material first

For repository analysis, inspect at least:

- README
- entry point
- command or request routing layer
- config / auth / client abstractions
- core execution path
- output and error layer
- build and test setup

Goal:

- produce a clean mental map before drafting

## 3. Read this repo's blog conventions

Inspect:

- `README.md`
- one or two recent technical posts in `source/_posts`

Confirm:

- front matter style
- tone and section density
- how local figures are referenced

## 4. Create the target files

- create `source/_posts/YYYY/MM/DD/<post>.md`
- create `source/_posts/YYYY/MM/DD/<post>/`

If needed, use:

```bash
pnpm new:tech -- "文章标题"
```

Manual creation is also fine when you need an exact path or filename.

## 5. Draft the article structure

Recommended order:

1. 摘要
2. 阅读预备 / 术语解释
3. 问题定义 or 产品定位
4. 架构全景
5. 关键模块拆解
6. 关键执行链路
7. 工程化 / 测试 / 发布
8. 最后总结

## 6. Add diagrams

- every major chapter should have at least one figure
- prefer Chinese SVGs
- use `figure-01.svg`, `figure-02.svg`, ...
- reference with `{% asset_img figure-01.svg %}`

## 7. Add code snippets

Rules:

- trim to the minimum needed to show the idea
- state when the snippet is adapted or trimmed
- comment every line in Chinese
- prefer a few short snippets over one giant snippet

## 8. Validate

Run:

```bash
pnpm build
```

Then confirm:

- the build passes
- the article file is in the right path
- the local asset folder exists
- the figure references are correct

## 9. Final response

Summarize:

- created or updated post path
- created asset paths
- whether the build passed
- any caveats or follow-up edits worth making
