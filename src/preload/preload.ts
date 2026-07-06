import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('markstack', {
  openMarkdownFile: () => ipcRenderer.invoke('file:open'),
  openMarkdownFileByPath: (filePath: string) => ipcRenderer.invoke('file:openPath', filePath),
  saveMarkdownFile: (payload: { filePath?: string; content: string }) =>
    ipcRenderer.invoke('file:save', payload),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
});

