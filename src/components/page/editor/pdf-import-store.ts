"use client";

import { useSyncExternalStore } from "react";

// The PDF being imported into this page, if any. Like upload progress, it
// lives outside the document, so the others never see a half-done import.

export type PdfImportState =
  | { fileName: string; phase: "uploading"; progress: number }
  | { fileName: string; phase: "reading" }
  | { fileName: string; phase: "done"; pages: number; images: number }
  | { fileName: string; phase: "error"; error: string };

let state: PdfImportState | null = null;
const listeners = new Set<() => void>();

export const pdfImportStore = {
  set(next: PdfImportState | null) {
    state = next;
    for (const listener of listeners) listener();
  },
  get: () => state,
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePdfImport(): PdfImportState | null {
  return useSyncExternalStore(subscribe, pdfImportStore.get, () => null);
}
