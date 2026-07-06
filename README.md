# MarkStack Desktop

MarkStack is a Windows desktop Markdown editor and previewer built with Electron, React, TypeScript, Vite, CodeMirror, MarkdownIt, and highlight.js.

## Features

- Open, edit, and save Markdown files
- Split editor and preview workspace
- Synchronized editor and preview scrolling
- Recent file list
- Heading outline
- Light and dark themes
- Code block highlighting
- External links open in the system browser
- Windows NSIS installer

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run typecheck
npm run build
npm run dist
```

The Windows installer is generated under `release/`.
