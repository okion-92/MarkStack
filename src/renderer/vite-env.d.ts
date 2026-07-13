/// <reference types="vite/client" />

type OpenMarkdownResult =
  | { canceled: true; error?: string; filePath?: string }
  | {
      canceled: false;
      filePath: string;
      fileName: string;
      content: string;
    };

type OpenImageResult =
  | { canceled: true; error?: string }
  | {
      canceled: false;
      filePath: string;
      fileName: string;
      mimeType: string;
      dataUrl: string;
    };

type SaveMarkdownResult =
  | { canceled: true; error?: string; filePath?: string }
  | {
      canceled: false;
      filePath: string;
      fileName: string;
    };

type WorkspaceFileResult = {
  filePath: string;
  fileName: string;
  relativePath: string;
};

type OpenWorkspaceResult =
  | { canceled: true; error?: string }
  | {
      canceled: false;
      rootPath: string;
      rootName: string;
      files: WorkspaceFileResult[];
      truncated: boolean;
    };

type WorkspaceSearchMatch = WorkspaceFileResult & {
  lineNumber: number;
  lineText: string;
};

type SearchWorkspaceResult =
  | { success: true; matches: WorkspaceSearchMatch[]; truncated: boolean }
  | { success: false; error?: string };

type ExportHtmlResult =
  | { canceled: true; error?: string }
  | { canceled: false; filePath: string; fileName: string };

type OpenExternalResult =
  | { success: true }
  | { success: false; error?: string };

interface Window {
  markstack: {
    openMarkdownFile: () => Promise<OpenMarkdownResult>;
    openMarkdownFileByPath: (filePath: string) => Promise<OpenMarkdownResult>;
    openImageFile: () => Promise<OpenImageResult>;
    openWorkspaceFolder: () => Promise<OpenWorkspaceResult>;
    searchWorkspace: (payload: { rootPath: string; query: string }) => Promise<SearchWorkspaceResult>;
    saveMarkdownFile: (payload: {
      filePath?: string;
      content: string;
    }) => Promise<SaveMarkdownResult>;
    exportHtmlFile: (payload: {
      defaultPath?: string;
      html: string;
    }) => Promise<ExportHtmlResult>;
    openExternal: (url: string) => Promise<OpenExternalResult>;
    getPathForFile: (file: File) => string;
  };
}
