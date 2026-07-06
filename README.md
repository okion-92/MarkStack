# MarkStack Desktop

MarkStack Desktop is a Windows desktop Markdown editor and previewer. It is built with Electron, React, TypeScript, Vite, CodeMirror, MarkdownIt, highlight.js, and electron-builder.

The project currently focuses on the desktop EXE version. A WeChat Mini Program version can be developed later from the same product direction, but it is not included in this repository yet.

## Features

- Open local `.md`, `.markdown`, and text files
- Edit Markdown with CodeMirror
- Preview Markdown in real time
- Split view, editor-only view, and preview-only view
- Synchronized scrolling between editor and preview in split view
- Recent file list with one-click reopening
- Missing recent files are removed after a failed open attempt
- Heading outline extracted from Markdown headings
- Light and dark themes
- Code block highlighting
- External links in preview open in the system browser instead of replacing the app window
- Windows NSIS installer with assisted installation flow
- Upgrade flow can detect an existing installation and run the old uninstaller first

## Tech Stack

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

## Repository Branches

This repository uses a review-first workflow:

- `main`: stable baseline branch
- `dev`: active development branch

Do not push feature work directly to `main`. All implementation work should be committed to `dev`, reviewed through a Pull Request, and then merged into `main`.

## Install Dependencies

```bash
npm install
```

## Run in Development

```bash
npm run dev
```

This starts the Vite renderer development server and opens the Electron desktop app.

## Type Check

```bash
npm run typecheck
```

Run this before building or opening a Pull Request.

## Build App Files

```bash
npm run build
```

This builds:

- renderer files into `dist/`
- Electron main and preload files into `dist-electron/`

## Build Windows Installer

```bash
npm run dist
```

The generated Windows installer is placed under:

```text
release/
```

Example output:

```text
release/MarkStack-0.1.6-Setup.exe
```

The `release/`, `dist/`, `dist-electron/`, and `node_modules/` directories are intentionally ignored by Git.

## Recommended Local Workflow

Make sure you are working on `dev`:

```bash
git switch dev
```

Pull the latest remote `dev`:

```bash
git pull origin dev
```

Make code changes, then verify:

```bash
npm run typecheck
npm run build
```

Commit changes:

```bash
git status
git add .
git commit -m "Describe your change"
```

Push to GitHub:

```bash
git push origin dev
```

## Merge `dev` into `main` Through GitHub

Use this process when the changes on `dev` are ready for review and release.

### 1. Open the Repository

Go to:

```text
https://github.com/okion-92/MarkStack
```

### 2. Open a Compare Page

Use this direct compare link:

```text
https://github.com/okion-92/MarkStack/compare/main...dev?expand=1
```

Or open it manually:

1. Click `Pull requests`
2. Click `New pull request`
3. Set `base` to `main`
4. Set `compare` to `dev`

The direction must be:

```text
base: main
compare: dev
```

This means GitHub will merge changes from `dev` into `main`.

### 3. Review the Changes

Check the changed files and commit list on the compare page.

Confirm that:

- the changes are expected
- generated folders such as `node_modules/`, `dist/`, `dist-electron/`, and `release/` are not included
- the app has passed `npm run typecheck`
- the app has passed `npm run build`
- the Windows installer has been rebuilt with `npm run dist` when needed

### 4. Create the Pull Request

Click:

```text
Create pull request
```

Fill in the title and description. A good title is short and specific, for example:

```text
Add MarkStack desktop app
```

### 5. Merge the Pull Request

After review, click:

```text
Merge pull request
```

Then click:

```text
Confirm merge
```

After the PR is merged, `main` will contain the reviewed changes from `dev`.

### 6. Sync Local `main`

After merging on GitHub, update your local `main` branch:

```bash
git switch main
git pull origin main
```

Then switch back to `dev` for future development:

```bash
git switch dev
```

## If the Pull Request Button Does Not Appear

Check these items:

1. Make sure the compare direction is correct:

```text
base: main
compare: dev
```

2. Make sure both branches exist on GitHub:

```bash
git ls-remote --heads origin
```

You should see both:

```text
refs/heads/main
refs/heads/dev
```

3. Make sure `dev` has changes that are not already in `main`.

If GitHub says there is nothing to compare, it usually means `main` already contains all commits from `dev`.

4. If GitHub says the page is outdated because one branch had recent pushes, refresh the browser page or reopen:

```text
https://github.com/okion-92/MarkStack/compare/main...dev?expand=1
```

## Project Structure

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

## Notes

- This project currently targets Windows desktop packaging.
- The installer is unsigned, so Windows may show a security warning.
- Build artifacts are not committed to Git.
- Keep new development on `dev` and use Pull Requests to merge into `main`.
