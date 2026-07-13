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

type OpenExternalResult =
  | { success: true }
  | { success: false; error?: string };

interface Window {
  markstack: {
    openMarkdownFile: () => Promise<OpenMarkdownResult>;
    openMarkdownFileByPath: (filePath: string) => Promise<OpenMarkdownResult>;
    openImageFile: () => Promise<OpenImageResult>;
    saveMarkdownFile: (payload: {
      filePath?: string;
      content: string;
    }) => Promise<SaveMarkdownResult>;
    openExternal: (url: string) => Promise<OpenExternalResult>;
    getPathForFile: (file: File) => string;
  };
}
