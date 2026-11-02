"use client";

import { createContext, use } from "react";

export type PageEditorContext = {
  editable: boolean;
  /** Uploads a file into the given screenshot block. */
  uploadInto: (blockId: string, file: File) => void;
};

export const EditorContext = createContext<PageEditorContext | null>(null);

export function usePageEditor(): PageEditorContext {
  const ctx = use(EditorContext);
  if (!ctx) throw new Error("usePageEditor must be used inside NotebookEditor");
  return ctx;
}
