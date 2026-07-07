# MarkStack Desktop / MarkStack 桌面端

MarkStack Desktop is a Windows desktop Markdown editor and previewer. It is built with Electron, React, TypeScript, Vite, CodeMirror, MarkdownIt, highlight.js, and electron-builder.

MarkStack 桌面端是一个 Windows Markdown 编辑与预览工具，基于 Electron、React、TypeScript、Vite、CodeMirror、MarkdownIt、highlight.js 和 electron-builder 构建。

The project currently focuses on the desktop EXE version. A WeChat Mini Program version can be developed later from the same product direction, but it is not included in this repository yet.

当前仓库优先实现桌面端 EXE。微信小程序版本可以沿用同一产品方向继续扩展，但暂未包含在本仓库中。

## Features / 功能

- Open local `.md`, `.markdown`, and text files
- 打开本地 `.md`、`.markdown` 和文本文件
- Edit Markdown with CodeMirror
- 使用 CodeMirror 编辑 Markdown
- Preview Markdown in real time
- 实时预览 Markdown
- Split view, editor-only view, and preview-only view
- 支持分栏、仅编辑、仅预览三种视图
- Synchronized scrolling between editor and preview in split view
- 分栏模式下编辑区与预览区同步滚动
- Recent file list with one-click reopening
- 最近文件列表支持点击重新打开
- Missing recent files are removed after a failed open attempt
- 最近文件不存在时会提示并自动移除记录
- Heading outline extracted from Markdown headings
- 自动提取 Markdown 标题目录
- Embedded images are stored as base64 data URI inside Markdown
- 图片以 base64 data URI 嵌入 Markdown，换电脑、换目录或换服务器也不影响加载
- Link insertion and external link protection
- 支持插入链接，预览中的外部链接会用系统浏览器打开，不会覆盖 MarkStack 窗口
- Formatting toolbar for headings, bold, italic, strikethrough, inline code, lists, quote, code block, font size, font family, color, and alignment
- 格式工具栏支持标题、粗体、斜体、删除线、行内代码、列表、引用、代码块、字号、字体、颜色和段落对齐
- Light and dark themes
- 浅色和深色主题
- Code block highlighting
- 代码块高亮
- Windows NSIS installer with assisted installation flow
- Windows NSIS 安装包，支持引导式安装流程
- Upgrade flow can detect an existing installation and run the old uninstaller first
- 升级安装时可检测旧版本，并先执行旧版本卸载流程

## Tech Stack / 技术栈

- Electron
- React
- TypeScript
- Vite
- CodeMirror
- MarkdownIt
- highlight.js
- lucide-react
- electron-builder
- NSIS

## Repository Branches / 仓库分支

This repository uses a review-first workflow.

本仓库采用先审核、再合并的工作流。

- `main`: stable baseline branch
- `main`：稳定基准分支
- `dev`: active development branch
- `dev`：日常开发分支

Do not push feature work directly to `main`. All implementation work should be committed to `dev`, reviewed through a Pull Request, and then merged into `main`.

不要直接把功能代码推送到 `main`。所有开发改动都应该提交到 `dev`，通过 Pull Request 审核后再合并到 `main`。

## Install Dependencies / 安装依赖

```bash
npm install
```

## Run in Development / 本地开发运行

```bash
npm run dev
```

This starts the Vite renderer development server and opens the Electron desktop app.

该命令会启动 Vite 渲染进程开发服务，并打开 Electron 桌面应用。

## Type Check / 类型检查

```bash
npm run typecheck
```

Run this before building or opening a Pull Request.

构建或发起 Pull Request 前建议先执行该命令。

## Build App Files / 构建应用文件

```bash
npm run build
```

This builds:

该命令会构建：

- renderer files into `dist/`
- 渲染进程文件到 `dist/`
- Electron main and preload files into `dist-electron/`
- Electron 主进程和 preload 文件到 `dist-electron/`

## Build Windows Installer / 构建 Windows 安装包

```bash
npm run dist
```

The generated Windows installer is placed under:

生成的 Windows 安装包位于：

```text
release/
```

Example output:

示例输出：

```text
release/MarkStack-0.1.13-Setup.exe
```

The `release/`, `dist/`, `dist-electron/`, and `node_modules/` directories are intentionally ignored by Git.

`release/`、`dist/`、`dist-electron/` 和 `node_modules/` 目录不会提交到 Git。

## Recommended Local Workflow / 推荐本地开发流程

Make sure you are working on `dev`.

确认当前在 `dev` 分支：

```bash
git switch dev
```

Pull the latest remote `dev`.

拉取远程最新 `dev`：

```bash
git pull origin dev
```

Make code changes, then verify.

修改代码后执行验证：

```bash
npm run typecheck
npm run build
```

Commit changes.

提交改动：

```bash
git status
git add .
git commit -m "Describe your change"
```

Push to GitHub.

推送到 GitHub：

```bash
git push origin dev
```

## Merge `dev` into `main` Through GitHub / 通过 GitHub 将 `dev` 合并到 `main`

Use this process when the changes on `dev` are ready for review and release.

当 `dev` 上的改动准备审核和发布时，使用以下流程。

### 1. Open the Repository / 打开仓库

Go to:

访问：

```text
https://github.com/okion-92/MarkStack
```

### 2. Open a Compare Page / 打开比较页面

Use this direct compare link:

可以直接打开：

```text
https://github.com/okion-92/MarkStack/compare/main...dev?expand=1
```

Or open it manually:

也可以手动操作：

1. Click `Pull requests`
2. 点击 `Pull requests`
3. Click `New pull request`
4. 点击 `New pull request`
5. Set `base` to `main`
6. 将 `base` 设置为 `main`
7. Set `compare` to `dev`
8. 将 `compare` 设置为 `dev`

The direction must be:

方向必须是：

```text
base: main
compare: dev
```

This means GitHub will merge changes from `dev` into `main`.

这表示 GitHub 会把 `dev` 的改动合并到 `main`。

### 3. Review the Changes / 审核变更

Check the changed files and commit list on the compare page.

在比较页面检查文件变更和提交列表。

Confirm that:

确认以下内容：

- the changes are expected
- 变更内容符合预期
- generated folders such as `node_modules/`, `dist/`, `dist-electron/`, and `release/` are not included
- 没有包含 `node_modules/`、`dist/`、`dist-electron/`、`release/` 等生成目录
- the app has passed `npm run typecheck`
- 已通过 `npm run typecheck`
- the app has passed `npm run build`
- 已通过 `npm run build`
- the Windows installer has been rebuilt with `npm run dist` when needed
- 如涉及安装包交付，已执行 `npm run dist` 重新生成 Windows 安装包

### 4. Create the Pull Request / 创建 Pull Request

Click:

点击：

```text
Create pull request
```

Fill in the title and description.

填写标题和说明。

Recommended Pull Request description format:

推荐 PR 描述格式：

```markdown
## 摘要 / Summary

中文摘要。

English summary.

## 变更内容 / Changes

- 中文变更点
- English change item

## 验证方式 / Verification

- 中文验证方式
- English verification item

## 合并说明 / Merge Notes

中文合并说明。

English merge notes.
```

### 5. Merge the Pull Request / 合并 Pull Request

After review, click:

审核无误后点击：

```text
Merge pull request
```

Then click:

然后点击：

```text
Confirm merge
```

After the PR is merged, `main` will contain the reviewed changes from `dev`.

合并完成后，`main` 就会包含 `dev` 中已审核通过的改动。

### 6. Sync Local `main` / 同步本地 `main`

After merging on GitHub, update your local `main` branch:

在 GitHub 合并后，同步本地 `main`：

```bash
git switch main
git pull origin main
```

Then switch back to `dev` for future development:

然后切回 `dev` 继续开发：

```bash
git switch dev
```

## If the Pull Request Button Does Not Appear / 如果看不到 Pull Request 按钮

Check these items:

检查以下项目：

1. Make sure the compare direction is correct.
2. 确认比较方向正确。

```text
base: main
compare: dev
```

3. Make sure both branches exist on GitHub.
4. 确认 GitHub 上同时存在两个分支。

```bash
git ls-remote --heads origin
```

You should see both:

应该能看到：

```text
refs/heads/main
refs/heads/dev
```

5. Make sure `dev` has changes that are not already in `main`.
6. 确认 `dev` 中确实存在 `main` 尚未包含的改动。

If GitHub says there is nothing to compare, it usually means `main` already contains all commits from `dev`.

如果 GitHub 提示没有可比较内容，通常说明 `main` 已经包含了 `dev` 的所有提交。

If GitHub says the page is outdated because one branch had recent pushes, refresh the browser page or reopen:

如果 GitHub 提示分支刚刚有新推送，刷新页面或重新打开：

```text
https://github.com/okion-92/MarkStack/compare/main...dev?expand=1
```

## Project Structure / 项目结构

```text
.
├── build/
│   └── installer.nsh
├── src/
│   ├── main/
│   │   └── main.ts
│   ├── preload/
│   │   └── preload.ts
│   └── renderer/
│       ├── App.tsx
│       ├── main.tsx
│       ├── styles.css
│       └── vite-env.d.ts
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

## Notes / 说明

- This project currently targets Windows desktop packaging.
- 当前项目主要面向 Windows 桌面端打包。
- The installer is unsigned, so Windows may show a security warning.
- 安装包暂未签名，Windows 可能会显示安全提示。
- Build artifacts are not committed to Git.
- 构建产物不会提交到 Git。
- Keep new development on `dev` and use Pull Requests to merge into `main`.
- 后续开发保持在 `dev`，通过 Pull Request 合并到 `main`。
