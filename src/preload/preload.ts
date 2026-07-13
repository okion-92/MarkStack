import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('markstack', {
  openMarkdownFile: () => ipcRenderer.invoke('file:open'),
  openMarkdownFileByPath: (filePath: string) => ipcRenderer.invoke('file:openPath', filePath),
  openImageFile: () => ipcRenderer.invoke('file:openImage'),
  openWorkspaceFolder: () => ipcRenderer.invoke('workspace:openFolder'),
  searchWorkspace: (payload: { rootPath: string; query: string }) => ipcRenderer.invoke('workspace:search', payload),
  saveMarkdownFile: (payload: { filePath?: string; content: string }) =>
    ipcRenderer.invoke('file:save', payload),
  exportHtmlFile: (payload: { defaultPath?: string; html: string }) =>
    ipcRenderer.invoke('file:exportHtml', payload),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
});
