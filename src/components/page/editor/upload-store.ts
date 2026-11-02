"use client";

import { useSyncExternalStore } from "react";

// Upload progress per screenshot block, kept outside the document so it is
// never saved with the page.

export type UploadState = { progress: number; error: string | null };

const uploads = new Map<string, UploadState>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const uploadStore = {
  set(blockId: string, state: UploadState) {
    uploads.set(blockId, state);
    emit();
  },
  clear(blockId: string) {
    uploads.delete(blockId);
    emit();
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUploadState(blockId: string): UploadState | undefined {
  return useSyncExternalStore(
    subscribe,
    () => uploads.get(blockId),
    () => undefined,
  );
}
