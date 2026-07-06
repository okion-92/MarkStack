import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageMimeTypes: Record<string, string> = {
  '.bmp': 'image/bmp',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

type SavePayload = {
  filePath?: string;
  content: string;
};

async function readMarkdownFile(filePath: string) {
  const content = await fs.readFile(filePath, 'utf8');
  return {
    canceled: false,
    filePath,
    fileName: path.basename(filePath),
    content,
  };
}

async function readImageFile(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = imageMimeTypes[extension] ?? 'application/octet-stream';
  const buffer = await fs.readFile(filePath);

  return {
    canceled: false,
    filePath,
    fileName: path.basename(filePath),
    mimeType,
    dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
  };
}

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

function isAppNavigationUrl(url: string) {
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    return url.startsWith(process.env.VITE_DEV_SERVER_URL);
  }
  return url.startsWith('file://');
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    title: 'MarkStack',
    backgroundColor: '#f6f7f9',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppNavigationUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!isAppNavigationUrl(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    void win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog({
    title: '打开 Markdown 文件',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
      { name: 'Text', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  return readMarkdownFile(result.filePaths[0]);
});

ipcMain.handle('file:openPath', async (_event, filePath: string) => {
  if (!filePath || typeof filePath !== 'string') {
    return { canceled: true, error: '文件路径无效。' };
  }

  try {
    return await readMarkdownFile(filePath);
  } catch {
    return { canceled: true, filePath, error: '文件不存在或无法读取。' };
  }
});

ipcMain.handle('file:openImage', async () => {
  const result = await dialog.showOpenDialog({
    title: '嵌入图片',
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  try {
    return await readImageFile(result.filePaths[0]);
  } catch {
    return { canceled: true, error: '图片不存在或无法读取。' };
  }
});

ipcMain.handle('file:save', async (_event, payload: SavePayload) => {
  let targetPath = payload.filePath;

  if (!targetPath) {
    const result = await dialog.showSaveDialog({
      title: '保存 Markdown 文件',
      defaultPath: 'untitled.md',
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    targetPath = result.filePath;
  }

  await fs.writeFile(targetPath, payload.content, 'utf8');

  return {
    canceled: false,
    filePath: targetPath,
    fileName: path.basename(targetPath),
  };
});

ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  await shell.openExternal(url);
});
