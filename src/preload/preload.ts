import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('markstack', {
  openMarkdownFile: () => ipcRenderer.invoke('file:open'),
  openMarkdownFileByPath: (filePath: string) => ipcRenderer.invoke('file:openPath', filePath),
  openImageFile: () => ipcRenderer.invoke('file:openImage'),
  openWorkspaceFolder: () => ipcRenderer.invoke('workspace:openFolder'),
  openWorkspaceFolderByPath: (rootPath: string) => ipcRenderer.invoke('workspace:openPath', rootPath),
  searchWorkspace: (payload: { rootPath: string; query: string }) => ipcRenderer.invoke('workspace:search', payload),
  saveMarkdownFile: (payload: { filePath?: string; content: string }) =>
    ipcRenderer.invoke('file:save', payload),
  exportHtmlFile: (payload: { defaultPath?: string; html: string }) =>
    ipcRenderer.invoke('file:exportHtml', payload),
  exportPdfFile: (payload: { defaultPath?: string; html: string; pdfOptions?: { pageSize?: 'A4' | 'Letter'; landscape?: boolean; marginType?: 'default' | 'none' } }) =>
    ipcRenderer.invoke('file:exportPdf', payload),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
});
