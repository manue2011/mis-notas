"use client";

import { useOptimistic, useRef, useState, useTransition, type DragEvent } from "react";
import { movePageAction } from "@/lib/pages/move";
import { applyMove, canMoveUnder, type FlatPage, type PageMove, type PageNode } from "@/lib/pages/tree";
import type { DropZone } from "./tree-context";

const DRAG_TYPE = "application/x-libreta-page";
// Hovering over a closed branch this long while dragging opens it.
const AUTO_OPEN_MS = 600;

type Options = {
  organizationId: string;
  pages: FlatPage[];
  expanded: Set<string>;
  setOpen: (ids: string[], open: boolean) => void;
};

/**
 * Native HTML5 drag and drop for the sidebar tree. The top and bottom quarter
 * of a row drop before/after it; the middle drops inside it.
 */
export function usePageDrag({ organizationId, pages, expanded, setOpen }: Options) {
  const [optimisticPages, addMove] = useOptimistic(pages, (current: FlatPage[], move: PageMove) =>
    applyMove(current, move),
  );
  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; zone: DropZone } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openTimer = useRef<{ id: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  function clearOpenTimer() {
    if (openTimer.current) clearTimeout(openTimer.current.timer);
    openTimer.current = null;
  }

  function moveFor(target: PageNode, zone: DropZone): PageMove | null {
    if (!draggingId || target.id === draggingId) return null;
    if (zone === "inside") {
      return canMoveUnder(optimisticPages, draggingId, target.id)
        ? { pageId: draggingId, parentId: target.id, beforeId: null }
        : null;
    }
    if (!canMoveUnder(optimisticPages, draggingId, target.parentId)) return null;
    if (zone === "before") return { pageId: draggingId, parentId: target.parentId, beforeId: target.id };
    const siblings = optimisticPages.filter((p) => p.parentId === target.parentId && p.id !== draggingId);
    const next = siblings[siblings.findIndex((p) => p.id === target.id) + 1];
    return { pageId: draggingId, parentId: target.parentId, beforeId: next?.id ?? null };
  }

  function onDragStart(event: DragEvent, node: PageNode) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DRAG_TYPE, node.id);
    setError(null);
    setDraggingId(node.id);
  }

  function onDragOver(event: DragEvent, node: PageNode) {
    if (!draggingId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    const zone: DropZone = y < 0.25 ? "before" : y > 0.75 ? "after" : "inside";
    if (!moveFor(node, zone)) {
      if (dropTarget) setDropTarget(null);
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTarget?.id !== node.id || dropTarget.zone !== zone) setDropTarget({ id: node.id, zone });

    if (zone === "inside" && node.children.length > 0 && !expanded.has(node.id)) {
      if (openTimer.current?.id !== node.id) {
        clearOpenTimer();
        openTimer.current = { id: node.id, timer: setTimeout(() => setOpen([node.id], true), AUTO_OPEN_MS) };
      }
    } else {
      clearOpenTimer();
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    const target = dropTarget && optimisticPages.find((p) => p.id === dropTarget.id);
    const node = target ? { ...target, children: [] } : null;
    const move = node && dropTarget ? moveFor(node, dropTarget.zone) : null;
    onDragEnd();
    if (!move) return;
    if (move.parentId) setOpen([move.parentId], true);
    startTransition(async () => {
      addMove(move);
      const result = await movePageAction(organizationId, move.pageId, move.parentId, move.beforeId);
      if (!result.ok) setError(result.error);
    });
  }

  function onDragEnd() {
    clearOpenTimer();
    setDraggingId(null);
    setDropTarget(null);
  }

  return { pages: optimisticPages, draggingId, dropTarget, error, onDragStart, onDragOver, onDrop, onDragEnd };
}
