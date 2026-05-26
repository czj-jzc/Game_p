/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI?: {
      saveProgress: (data: unknown) => Promise<void>;
      loadProgress: () => Promise<unknown | null>;
      clearProgress: () => Promise<null>;
    };
  }
}

export {};
