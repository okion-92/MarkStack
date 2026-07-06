/// <reference types="vite/client" />

type OpenMarkdownResult =
  | { canceled: true; error?: string; filePath?: string }
  | {
      canceled: false;
      filePath: string;
      fileName: string;
      content: string;
    };

type SaveMarkdownResult =
  | { canceled: true; error?: string; filePath?: string }
  | {
      canceled: false;
      filePath: string;
      fileName: string;
    };

interface Window {
  markstack: {
    openMarkdownFile: () => Promise<OpenMarkdownResult>;
    openMarkdownFileByPath: (filePath: string) => Promise<OpenMarkdownResult>;
    saveMarkdownFile: (payload: {
      filePath?: string;
      content: string;
    }) => Promise<SaveMarkdownResult>;
    openExternal: (url: string) => Promise<void>;
  };
}

