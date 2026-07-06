import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import type { EditorView, ViewUpdate } from '@codemirror/view';
import hljs from 'highlight.js';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Columns2,
  Eye,
  FileDown,
  FilePlus2,
  FolderOpen,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Moon,
  PanelLeft,
  Palette,
  Quote,
  Save,
  Search,
  Strikethrough,
  Sun,
  Type,
} from 'lucide-react';
import MarkdownIt from 'markdown-it';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';

type ViewMode = 'split' | 'editor' | 'preview';

type RecentFile = {
  filePath: string;
  fileName: string;
};

type Heading = {
  id: string;
  level: number;
  text: string;
};

type EditorInsert = {
  text: string;
  selectionStart?: number;
  selectionEnd?: number;
  status: string;
};

type EditorRange = {
  from: number;
  to: number;
};

const welcomeDocument = `# 欢迎使用 MarkStack

这是一个本地 Markdown 编辑器。

## 已支持

- 打开、编辑和保存 .md 文件
- 左右分栏实时预览
- 编辑区和预览区同步滚动
- 最近文件记录
- 预览链接在系统浏览器打开
- 图片以 data URI 嵌入，换目录或换电脑也能加载
- 链接、字体和段落格式工具栏
- 浅色和深色主题
- 代码块高亮


demo: 选中文本后试试顶部格式工具栏。

\`\`\`ts
const message = 'Start writing.';
console.log(message);
\`\`\`
`;

const recentStorageKey = 'markstack.recentFiles';
const themeStorageKey = 'markstack.theme';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function extractHeadings(markdownText: string): Heading[] {
  return markdownText
    .split(/\r?\n/)
    .map((line) => /^(#{1,4})\s+(.+)$/.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => ({
      level: match[1].length,
      text: match[2].replace(/[#*_`]/g, '').trim(),
      id: slugify(match[2]),
    }));
}

function loadRecentFiles(): RecentFile[] {
  try {
    const raw = window.localStorage.getItem(recentStorageKey);
    return raw ? (JSON.parse(raw) as RecentFile[]) : [];
  } catch {
    return [];
  }
}

function getInitialDarkMode() {
  const stored = window.localStorage.getItem(themeStorageKey);
  if (stored) {
    return stored === 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getScrollRatio(element: HTMLElement) {
  const maxScroll = element.scrollHeight - element.clientHeight;
  return maxScroll > 0 ? element.scrollTop / maxScroll : 0;
}

function scrollToRatio(element: HTMLElement, ratio: number) {
  const maxScroll = element.scrollHeight - element.clientHeight;
  element.scrollTop = maxScroll > 0 ? maxScroll * ratio : 0;
}

function fileNameWithoutExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '') || fileName;
}

function ensureUrlProtocol(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /^([a-z][a-z\d+.-]*:|#)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function clampRange(range: EditorRange, length: number): EditorRange {
  const from = Math.max(0, Math.min(range.from, length));
  const to = Math.max(from, Math.min(range.to, length));
  return { from, to };
}

function getLineRange(value: string, range: EditorRange): EditorRange {
  const safeRange = clampRange(range, value.length);
  const fromBreak = value.lastIndexOf('\n', Math.max(0, safeRange.from - 1));
  const nextBreak = value.indexOf('\n', safeRange.to);
  return {
    from: fromBreak === -1 ? 0 : fromBreak + 1,
    to: nextBreak === -1 ? value.length : nextBreak,
  };
}
export default function App() {
  const [content, setContent] = useState(welcomeDocument);
  const [filePath, setFilePath] = useState<string | undefined>();
  const [fileName, setFileName] = useState('untitled.md');
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<ViewMode>('split');
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(loadRecentFiles);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('准备就绪');
  const previewPaneRef = useRef<HTMLElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const editorScrollRef = useRef<HTMLElement | null>(null);
  const editorCleanupRef = useRef<(() => void) | null>(null);
  const syncSourceRef = useRef<'editor' | 'preview' | null>(null);
  const syncResetTimerRef = useRef<number | null>(null);
  const modeRef = useRef<ViewMode>(mode);
  const contentRef = useRef(content);
  const editorSelectionRef = useRef<EditorRange>({ from: 0, to: 0 });
  const toolbarChangeRef = useRef(false);
  const toolbarStatusRef = useRef<{ message: string; until: number } | null>(null);

  const headings = useMemo(() => extractHeadings(content), [content]);

  const markdownRenderer = useMemo<MarkdownIt>(() => {
    return new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight(str: string, lang: string): string {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre><code class="hljs language-${lang}">${hljs.highlight(str, {
              language: lang,
              ignoreIllegals: true,
            }).value}</code></pre>`;
          } catch {
            return '';
          }
        }
        return `<pre><code class="hljs">${escapeHtml(str)}</code></pre>`;
      },
    });
  }, []);

  const renderedHtml = useMemo(() => {
    const raw = markdownRenderer.render(content);
    return raw.replace(/<h([1-4])>(.*?)<\/h\1>/g, (_match: string, level: string, text: string) => {
      const plain = text.replace(/<[^>]+>/g, '');
      return `<h${level} id="${slugify(plain)}">${text}</h${level}>`;
    });
  }, [content, markdownRenderer]);

  const clearSyncSource = useCallback(() => {
    if (syncResetTimerRef.current !== null) {
      window.clearTimeout(syncResetTimerRef.current);
    }
    syncResetTimerRef.current = window.setTimeout(() => {
      syncSourceRef.current = null;
      syncResetTimerRef.current = null;
    }, 80);
  }, []);

  const syncScrollPosition = useCallback(
    (source: 'editor' | 'preview') => {
      if (modeRef.current !== 'split') {
        return;
      }
      if (syncSourceRef.current && syncSourceRef.current !== source) {
        return;
      }

      const sourceElement = source === 'editor' ? editorScrollRef.current : previewPaneRef.current;
      const targetElement = source === 'editor' ? previewPaneRef.current : editorScrollRef.current;
      if (!sourceElement || !targetElement) {
        return;
      }

      syncSourceRef.current = source;
      scrollToRatio(targetElement, getScrollRatio(sourceElement));
      clearSyncSource();
    },
    [clearSyncSource],
  );

  const handleEditorScroll = useCallback(() => {
    syncScrollPosition('editor');
  }, [syncScrollPosition]);

  const handlePreviewScroll = useCallback(() => {
    syncScrollPosition('preview');
  }, [syncScrollPosition]);

  const handleEditorCreated = useCallback(
    (view: EditorView) => {
      editorCleanupRef.current?.();
      editorViewRef.current = view;
      const scrollElement = view.scrollDOM;
      editorScrollRef.current = scrollElement;
      scrollElement.addEventListener('scroll', handleEditorScroll, { passive: true });
      editorCleanupRef.current = () => {
        scrollElement.removeEventListener('scroll', handleEditorScroll);
        if (editorScrollRef.current === scrollElement) {
          editorScrollRef.current = null;
        }
        if (editorViewRef.current === view) {
          editorViewRef.current = null;
        }
      };
    },
    [handleEditorScroll],
  );

  useEffect(() => {
    modeRef.current = mode;
    syncSourceRef.current = null;
  }, [mode]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    return () => {
      editorCleanupRef.current?.();
      if (syncResetTimerRef.current !== null) {
        window.clearTimeout(syncResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    window.localStorage.setItem(themeStorageKey, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const nextTitle = `${dirty ? '* ' : ''}${fileName} - MarkStack`;
    document.title = nextTitle;
  }, [dirty, fileName]);

  function updateRecentFiles(nextFiles: RecentFile[]) {
    setRecentFiles(nextFiles);
    window.localStorage.setItem(recentStorageKey, JSON.stringify(nextFiles));
  }

  function rememberFile(next: RecentFile) {
    updateRecentFiles([
      next,
      ...recentFiles.filter((item) => item.filePath !== next.filePath),
    ].slice(0, 6));
  }

  function forgetRecentFile(targetPath: string) {
    updateRecentFiles(recentFiles.filter((item) => item.filePath !== targetPath));
  }

  function replaceDocument(nextContent: string, nextFilePath?: string, nextFileName = 'untitled.md') {
    contentRef.current = nextContent;
    editorSelectionRef.current = { from: 0, to: 0 };
    setContent(nextContent);
    setFilePath(nextFilePath);
    setFileName(nextFileName);
    setDirty(false);
    setStatus(nextFilePath ? `已打开 ${nextFileName}` : '新建文档');
  }

  function updateDocumentFromToolbar(
    range: EditorRange,
    insert: EditorInsert,
    source = editorViewRef.current?.state.doc.toString() ?? contentRef.current,
  ) {
    const view = editorViewRef.current;
    const safeRange = clampRange(range, source.length);
    const nextContent = `${source.slice(0, safeRange.from)}${insert.text}${source.slice(safeRange.to)}`;
    const selectionStart = safeRange.from + (insert.selectionStart ?? insert.text.length);
    const selectionEnd = safeRange.from + (insert.selectionEnd ?? insert.selectionStart ?? insert.text.length);

    contentRef.current = nextContent;
    editorSelectionRef.current = { from: selectionStart, to: selectionEnd };
    setContent(nextContent);
    setDirty(true);
    toolbarStatusRef.current = { message: insert.status, until: Date.now() + 1500 };
    setStatus(insert.status);

    if (view) {
      toolbarChangeRef.current = true;
      view.dispatch({
        changes: { from: safeRange.from, to: safeRange.to, insert: insert.text },
        selection: { anchor: selectionStart, head: selectionEnd },
      });
      view.focus();
    } else {
      setMode('split');
    }
  }

  function applyEditorInsert(insert: EditorInsert) {
    const view = editorViewRef.current;
    const source = view?.state.doc.toString() ?? contentRef.current;
    const rawRange = view
      ? { from: view.state.selection.main.from, to: view.state.selection.main.to }
      : editorSelectionRef.current;
    updateDocumentFromToolbar(rawRange, insert, source);
  }

  function applySelectedText(formatter: (selected: string) => EditorInsert) {
    const view = editorViewRef.current;
    const source = view?.state.doc.toString() ?? contentRef.current;
    const range = clampRange(
      view ? { from: view.state.selection.main.from, to: view.state.selection.main.to } : editorSelectionRef.current,
      source.length,
    );
    updateDocumentFromToolbar(range, formatter(source.slice(range.from, range.to)), source);
  }

  function applyInlineFormat(prefix: string, suffix: string, fallback: string, label: string) {
    applySelectedText((selected) => {
      const text = selected || fallback;
      return {
        text: `${prefix}${text}${suffix}`,
        selectionStart: prefix.length,
        selectionEnd: prefix.length + text.length,
        status: `已应用${label}`,
      };
    });
  }

  function applyLineFormat(formatter: (value: string) => string, label: string) {
    const view = editorViewRef.current;
    const source = view?.state.doc.toString() ?? contentRef.current;
    const rawRange = view
      ? { from: view.state.selection.main.from, to: view.state.selection.main.to }
      : editorSelectionRef.current;
    const range = getLineRange(source, rawRange);
    const selected = source.slice(range.from, range.to);
    const next = formatter(selected);

    updateDocumentFromToolbar(
      range,
      {
        text: next,
        selectionStart: 0,
        selectionEnd: next.length,
        status: `已应用${label}`,
      },
      source,
    );
  }

  function setHeading(level: number) {
    applyLineFormat(
      (value) => value
        .split('\n')
        .map((line) => (line.trim() ? `${'#'.repeat(level)} ${line.replace(/^#{1,6}\s+/, '')}` : line))
        .join('\n'),
      `${level}级标题`,
    );
  }

  function setParagraph() {
    applyLineFormat(
      (value) => value
        .split('\n')
        .map((line) => line.replace(/^#{1,6}\s+/, '').replace(/^>\s?/, '').replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''))
        .join('\n'),
      '正文段落',
    );
  }

  function setQuote() {
    applyLineFormat(
      (value) => value.split('\n').map((line) => (line ? `> ${line.replace(/^>\s?/, '')}` : '>')).join('\n'),
      '引用段落',
    );
  }

  function setUnorderedList() {
    applyLineFormat(
      (value) => value.split('\n').map((line) => (line.trim() ? `- ${line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')}` : line)).join('\n'),
      '无序列表',
    );
  }

  function setOrderedList() {
    applyLineFormat(
      (value) => value
        .split('\n')
        .map((line, index) => (line.trim() ? `${index + 1}. ${line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')}` : line))
        .join('\n'),
      '有序列表',
    );
  }

  function setCodeBlock() {
    applySelectedText((selected) => {
      const text = selected || 'code';
      return {
        text: `\n\`\`\`\n${text}\n\`\`\`\n`,
        selectionStart: 5,
        selectionEnd: 5 + text.length,
        status: '已插入代码块',
      };
    });
  }

  function insertLink() {
    const rawUrl = window.prompt('请输入链接地址', 'https://');
    if (rawUrl === null) {
      return;
    }

    const url = ensureUrlProtocol(rawUrl);
    if (!url) {
      setStatus('链接地址为空');
      return;
    }

    applySelectedText((selected) => {
      const text = selected || '链接文本';
      return {
        text: `[${text}](${url})`,
        selectionStart: 1,
        selectionEnd: 1 + text.length,
        status: '已插入链接',
      };
    });
  }

  async function insertEmbeddedImage() {
    const result = await window.markstack.openImageFile();
    if (result.canceled) {
      if (result.error) {
        setStatus(result.error);
      }
      return;
    }

    const alt = fileNameWithoutExtension(result.fileName);
    applyEditorInsert({
      text: `\n![${alt}](${result.dataUrl})\n`,
      selectionStart: 3,
      selectionEnd: 3 + alt.length,
      status: `已嵌入图片 ${result.fileName}`,
    });
  }

  function applyFontSize(size: string) {
    if (!size) {
      return;
    }
    applySelectedText((selected) => {
      const text = selected || '文字';
      const prefix = `<span style="font-size: ${size};">`;
      return {
        text: `${prefix}${text}</span>`,
        selectionStart: prefix.length,
        selectionEnd: prefix.length + text.length,
        status: '已应用字号',
      };
    });
  }

  function applyFontFamily(fontFamily: string) {
    if (!fontFamily) {
      return;
    }
    applySelectedText((selected) => {
      const text = selected || '文字';
      const prefix = `<span style="font-family: ${fontFamily};">`;
      return {
        text: `${prefix}${text}</span>`,
        selectionStart: prefix.length,
        selectionEnd: prefix.length + text.length,
        status: '已应用字体',
      };
    });
  }

  function applyFontColor(color: string) {
    applySelectedText((selected) => {
      const text = selected || '文字';
      const prefix = `<span style="color: ${color};">`;
      return {
        text: `${prefix}${text}</span>`,
        selectionStart: prefix.length,
        selectionEnd: prefix.length + text.length,
        status: '已应用文字颜色',
      };
    });
  }

  function applyAlignment(align: 'left' | 'center' | 'right') {
    applyLineFormat((value) => {
      const text = value.trim() || '段落内容';
      return `<p style="text-align: ${align};">\n${text}\n</p>`;
    }, align === 'left' ? '左对齐' : align === 'center' ? '居中对齐' : '右对齐');
  }

  async function openFile() {
    if (dirty && !window.confirm('当前文档尚未保存，继续打开新文件？')) {
      return;
    }

    const result = await window.markstack.openMarkdownFile();
    if (result.canceled) {
      return;
    }

    replaceDocument(result.content, result.filePath, result.fileName);
    rememberFile({ filePath: result.filePath, fileName: result.fileName });
  }

  async function openRecentFile(item: RecentFile) {
    if (dirty && !window.confirm('当前文档尚未保存，继续打开最近文件？')) {
      return;
    }

    const result = await window.markstack.openMarkdownFileByPath(item.filePath);
    if (result.canceled) {
      window.alert(result.error ?? '最近文件无法打开。');
      forgetRecentFile(item.filePath);
      setStatus(`无法打开 ${item.fileName}`);
      return;
    }

    replaceDocument(result.content, result.filePath, result.fileName);
    rememberFile({ filePath: result.filePath, fileName: result.fileName });
  }

  function newFile() {
    if (dirty && !window.confirm('当前文档尚未保存，继续新建？')) {
      return;
    }

    replaceDocument('# Untitled\n\n', undefined, 'untitled.md');
  }

  async function saveFile(saveAs = false) {
    const result = await window.markstack.saveMarkdownFile({
      filePath: saveAs ? undefined : filePath,
      content,
    });

    if (result.canceled) {
      return;
    }

    setFilePath(result.filePath);
    setFileName(result.fileName);
    setDirty(false);
    rememberFile({ filePath: result.filePath, fileName: result.fileName });
    setStatus(`已保存 ${result.fileName}`);
  }

  function handleContentChange(value: string) {
    setContent(value);
    setDirty(true);
    setStatus('正在编辑');
  }

  const handleEditorUpdate = useCallback((viewUpdate: ViewUpdate) => {
    const range = viewUpdate.state.selection.main;
    editorSelectionRef.current = { from: range.from, to: range.to };
  }, []);

  function handlePreviewClick(event: MouseEvent<HTMLElement>) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute('href') ?? '';
    if (!href || href.startsWith('#')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      const url = new URL(href, filePath ? `file:///${filePath.replace(/\\/g, '/')}` : window.location.href);
      if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
        void window.markstack.openExternal(url.toString());
        setStatus('已在默认浏览器打开链接');
        return;
      }
    } catch {
      // Invalid links are left untouched after preventing navigation.
    }

    setStatus('已阻止在应用窗口内打开该链接');
  }

  const wordCount = useMemo(() => {
    const plain = content.replace(/data:image\/[a-z+.-]+;base64,[a-z\d+/=]+/gi, ' ').replace(/[#*_>`~\-[\]()]/g, ' ').trim();
    return plain ? plain.split(/\s+/).length : 0;
  }, [content]);

  const lineCount = useMemo(() => content.split(/\r?\n/).length, [content]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-name">MarkStack</div>
            <div className="brand-subtitle">Markdown Workspace</div>
          </div>
        </div>

        <div className="sidebar-actions">
          <button type="button" onClick={newFile} title="新建文档">
            <FilePlus2 size={17} />
            新建
          </button>
          <button type="button" onClick={openFile} title="打开 Markdown 文件">
            <FolderOpen size={17} />
            打开
          </button>
          <button type="button" onClick={() => void saveFile()} title="保存当前文件">
            <Save size={17} />
            保存
          </button>
          <button type="button" onClick={() => void saveFile(true)} title="另存为">
            <FileDown size={17} />
            另存
          </button>
        </div>

        <div className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="筛选目录"
          />
        </div>

        <section className="panel">
          <div className="panel-title">目录</div>
          <div className="toc-list">
            {headings
              .filter((heading) => heading.text.toLowerCase().includes(query.toLowerCase()))
              .map((heading) => (
                <a
                  href={`#${heading.id}`}
                  key={`${heading.id}-${heading.text}`}
                  style={{ paddingLeft: `${(heading.level - 1) * 10 + 10}px` }}
                >
                  {heading.text}
                </a>
              ))}
            {headings.length === 0 && <div className="empty-state">暂无标题</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">最近文件</div>
          <div className="recent-list">
            {recentFiles.map((item) => (
              <button
                type="button"
                className="recent-item"
                key={item.filePath}
                title={item.filePath}
                onClick={() => void openRecentFile(item)}
              >
                <span>{item.fileName}</span>
                <small>{item.filePath}</small>
              </button>
            ))}
            {recentFiles.length === 0 && <div className="empty-state">暂无记录</div>}
          </div>
        </section>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="file-meta">
            <span className={dirty ? 'dirty-dot active' : 'dirty-dot'} />
            <div>
              <h1>{fileName}</h1>
              <p>{filePath ?? '尚未保存到本地文件'}</p>
            </div>
          </div>

          <div className="view-controls" aria-label="视图切换">
            <button
              type="button"
              className={mode === 'editor' ? 'active' : ''}
              onClick={() => setMode('editor')}
              title="仅编辑"
            >
              <PanelLeft size={17} />
            </button>
            <button
              type="button"
              className={mode === 'split' ? 'active' : ''}
              onClick={() => setMode('split')}
              title="分栏"
            >
              <Columns2 size={17} />
            </button>
            <button
              type="button"
              className={mode === 'preview' ? 'active' : ''}
              onClick={() => setMode('preview')}
              title="仅预览"
            >
              <Eye size={17} />
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              title={darkMode ? '切换浅色' : '切换深色'}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <div className="format-toolbar" aria-label="格式工具栏">
          <div className="toolbar-group">
            <button type="button" title="正文" onClick={setParagraph}><Type size={16} /></button>
            <button type="button" title="一级标题" onClick={() => setHeading(1)}><Heading1 size={16} /></button>
            <button type="button" title="二级标题" onClick={() => setHeading(2)}><Heading2 size={16} /></button>
            <button type="button" title="三级标题" onClick={() => setHeading(3)}><Heading3 size={16} /></button>
          </div>
          <div className="toolbar-group">
            <button type="button" title="粗体" onClick={() => applyInlineFormat('**', '**', '粗体文字', '粗体')}><Bold size={16} /></button>
            <button type="button" title="斜体" onClick={() => applyInlineFormat('*', '*', '斜体文字', '斜体')}><Italic size={16} /></button>
            <button type="button" title="删除线" onClick={() => applyInlineFormat('~~', '~~', '删除线文字', '删除线')}><Strikethrough size={16} /></button>
            <button type="button" title="行内代码" onClick={() => applyInlineFormat('`', '`', 'code', '行内代码')}><Code2 size={16} /></button>
          </div>
          <div className="toolbar-group">
            <button type="button" title="插入链接" onClick={insertLink}><Link size={16} /></button>
            <button type="button" title="嵌入图片" onClick={() => void insertEmbeddedImage()}><ImagePlus size={16} /></button>
          </div>
          <div className="toolbar-group">
            <button type="button" title="引用" onClick={setQuote}><Quote size={16} /></button>
            <button type="button" title="无序列表" onClick={setUnorderedList}><List size={16} /></button>
            <button type="button" title="有序列表" onClick={setOrderedList}><ListOrdered size={16} /></button>
            <button type="button" title="代码块" onClick={setCodeBlock}><Code2 size={16} /></button>
          </div>
          <div className="toolbar-group">
            <button type="button" title="左对齐" onClick={() => applyAlignment('left')}><AlignLeft size={16} /></button>
            <button type="button" title="居中" onClick={() => applyAlignment('center')}><AlignCenter size={16} /></button>
            <button type="button" title="右对齐" onClick={() => applyAlignment('right')}><AlignRight size={16} /></button>
          </div>
          <div className="toolbar-group toolbar-selects">
            <select defaultValue="" title="字号" onChange={(event) => { applyFontSize(event.target.value); event.currentTarget.value = ''; }}>
              <option value="" disabled>字号</option>
              <option value="12px">12</option>
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="18px">18</option>
              <option value="24px">24</option>
              <option value="32px">32</option>
            </select>
            <select defaultValue="" title="字体" onChange={(event) => { applyFontFamily(event.target.value); event.currentTarget.value = ''; }}>
              <option value="" disabled>字体</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times</option>
              <option value="'Microsoft YaHei', sans-serif">雅黑</option>
              <option value="SimSun, serif">宋体</option>
              <option value="Consolas, monospace">代码</option>
            </select>
            <label className="color-control" title="自定义文字颜色">
              <Palette size={16} />
              <input
                type="color"
                defaultValue="#287c71"
                onInput={(event) => applyFontColor(event.currentTarget.value)}
                onChange={(event) => applyFontColor(event.currentTarget.value)}
              />
            </label>
            <button
              type="button"
              className="color-swatch"
              style={{ backgroundColor: '#d92d20' }}
              title="红色"
              onClick={() => applyFontColor('#d92d20')}
            />
            <button
              type="button"
              className="color-swatch"
              style={{ backgroundColor: '#287c71' }}
              title="绿色"
              onClick={() => applyFontColor('#287c71')}
            />
            <button
              type="button"
              className="color-swatch"
              style={{ backgroundColor: '#1d4ed8' }}
              title="蓝色"
              onClick={() => applyFontColor('#1d4ed8')}
            />
          </div>
        </div>

        <section className={`document-surface mode-${mode}`}>
          {mode !== 'preview' && (
            <div className="editor-pane">
              <CodeMirror
                value={content}
                height="100%"
                maxHeight="100%"
                extensions={[markdown()]}
                theme={darkMode ? 'dark' : 'light'}
                basicSetup={{
                  foldGutter: true,
                  lineNumbers: true,
                  highlightActiveLine: true,
                  autocompletion: true,
                }}
                onChange={handleContentChange}
                onCreateEditor={handleEditorCreated}
              />
            </div>
          )}

          {mode !== 'editor' && (
            <article
              ref={previewPaneRef}
              className="preview-pane markdown-body"
              onClick={handlePreviewClick}
              onScroll={handlePreviewScroll}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </section>

        <footer className="statusbar">
          <span>{status}</span>
          <span>{lineCount} 行</span>
          <span>{wordCount} 词</span>
          <span>{dirty ? '未保存' : '已保存'}</span>
        </footer>
      </main>
    </div>
  );
}





