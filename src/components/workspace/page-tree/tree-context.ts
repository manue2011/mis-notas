"use client";

import { createContext, useContext } from "react";
import type { DragEvent } from "react";
import type { PageNode } from "@/lib/pages/tree";

/** Where the dragged page would land relative to the row under the pointer. */
export type DropZone = "before" | "inside" | "after";

export type PageTreeContextValue = {
  slug: string;
  organizationId: string;
  currentId: string | null;
  expanded: Set<string>;
  setOpen: (ids: string[], open: boolean) => void;
  canCreate: boolean;
  canMove: boolean;
  draggingId: string | null;
  dropTarget: { id: string; zone: DropZone } | null;
  onDragStart: (event: DragEvent, node: PageNode) => void;
  onDragOver: (event: DragEvent, node: PageNode) => void;
  onDrop: (event: DragEvent) => void;
  onDragEnd: () => void;
};

export const PageTreeContext = createContext<PageTreeContextValue | null>(null);

export function usePageTree(): PageTreeContextValue {
  const value = useContext(PageTreeContext);
  if (!value) throw new Error("usePageTree must be used inside <PageTree>");
  return value;
}
