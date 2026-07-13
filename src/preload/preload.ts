import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('markstack', {
  openMarkdownFile: () => ipcRenderer.invoke('file:open'),
  openMarkdownFileByPath: (filePath: string) => ipcRenderer.invoke('file:openPath', filePath),
  openImageFile: () => ipcRenderer.invoke('file:openImage'),
  saveMarkdownFile: (payload: { filePath?: string; content: string }) =>
    ipcRenderer.invoke('file:save', payload),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
});
