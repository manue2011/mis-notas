"use client";

import { createContext, use } from "react";
import type { FlatPage } from "@/lib/pages/tree";

export type PageEditorContext = {
  editable: boolean;
  /** Uploads a file into the given screenshot block. */
  uploadInto: (blockId: string, file: File) => void;
  organizationId: string;
  slug: string;
  /** Live pages of the workspace, for "@" links and their current titles. */
  pages: FlatPage[];
  /** Screenshots whose url doesn't match aren't shown (someone else's images). */
  ownImagePattern: RegExp | null;
};

export const EditorContext = createContext<PageEditorContext | null>(null);

export function usePageEditor(): PageEditorContext {
  const ctx = use(EditorContext);
  if (!ctx) throw new Error("usePageEditor must be used inside NotebookEditor");
  return ctx;
}
