"use client";

// Which page link's preview is showing, kept outside the links themselves:
// BlockNote rebuilds an inline node whenever its React state changes, so a
// link can't hold "hovered" state of its own.

export type PreviewTarget = { pageId: string; top: number; left: number };

const HOVER_DELAY_MS = 350;

let current: PreviewTarget | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(next: PreviewTarget | null) {
  current = next;
  listeners.forEach((listener) => listener());
}

export const previewStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => current,
  /** Shows the preview under `anchor` after a short pause. */
  showSoon(pageId: string, anchor: HTMLElement) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!anchor.isConnected) return;
      const rect = anchor.getBoundingClientRect();
      set({ pageId, top: rect.bottom + 6, left: rect.left });
    }, HOVER_DELAY_MS);
  },
  hide() {
    clearTimeout(timer);
    if (current) set(null);
  },
};
