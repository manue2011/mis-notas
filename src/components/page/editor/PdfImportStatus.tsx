"use client";

import { useEffect } from "react";
import { FileText, X } from "lucide-react";
import { pdfImportStore, usePdfImport } from "./pdf-import-store";

const DONE_VISIBLE_MS = 5000;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** A small card in the corner while a PDF turns into blocks, then how it went. */
export function PdfImportStatus() {
  const state = usePdfImport();

  useEffect(() => {
    if (state?.phase !== "done") return;
    const timer = setTimeout(() => pdfImportStore.set(null), DONE_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [state]);

  if (!state) return null;
  const finished = state.phase === "done" || state.phase === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 z-30 flex w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-lg border border-border bg-surface p-4 shadow-paper"
    >
      <FileText size={20} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{state.fileName}</p>
        {state.phase === "uploading" ? (
          <>
            <p className="mt-0.5 text-sm text-ink-muted">Subiendo el PDF…</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.round(state.progress * 100)}%` }}
              />
            </div>
          </>
        ) : null}
        {state.phase === "reading" ? (
          <>
            <p className="mt-0.5 text-sm text-ink-muted">Pasando el texto y las imágenes a la página…</p>
            <p className="mt-1 font-hand text-base text-ink-muted">si tiene muchas fotos, tarda un poco</p>
          </>
        ) : null}
        {state.phase === "done" ? (
          <p className="mt-0.5 text-sm text-ink-muted">
            Listo: {plural(state.pages, "hoja", "hojas")}, {plural(state.images, "imagen", "imágenes")}.
          </p>
        ) : null}
        {state.phase === "error" ? <p className="mt-0.5 text-sm text-error">{state.error}</p> : null}
      </div>
      {finished ? (
        <button
          type="button"
          onClick={() => pdfImportStore.set(null)}
          aria-label="Cerrar aviso"
          className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-panel hover:text-ink"
        >
          <X size={16} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
