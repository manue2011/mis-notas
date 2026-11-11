"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { FlatPage } from "@/lib/pages/tree";
import type { PageBlock } from "../editor/schema";

const NotebookEditor = dynamic(() => import("../editor/NotebookEditor"), {
  ssr: false,
  loading: () => <div className="ruled min-h-40 font-serif text-lg text-ink-muted/60">Preparando la vista previa…</div>,
});

export type TidyPreviewProps = {
  organizationId: string;
  slug: string;
  pageId: string;
  pages: FlatPage[];
  ownImagePattern: string | null;
  blocks: PageBlock[];
  /** Uses left today, after this one. */
  remaining: number;
  /** The page changed while the AI worked: applying would undo those changes. */
  changedMeanwhile: boolean;
  onApply: () => void;
  onClose: () => void;
};

const noop = () => {};

/** The AI's version of the page, read-only, to apply or throw away. */
export function TidyPreview({ blocks, remaining, changedMeanwhile, onApply, onClose, ...page }: TidyPreviewProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="tidy-preview-title"
      onClose={onClose}
      className="m-auto hidden max-h-[min(52rem,calc(100dvh-2rem))] w-[min(48rem,calc(100vw-2rem))] flex-col rounded-xl border border-border bg-paper p-0 open:flex text-ink shadow-paper backdrop:bg-[rgb(20_17_14/0.4)]"
    >
      <header className="flex items-start gap-3 border-b border-dashed border-border px-5 py-3 md:px-8">
        <div className="min-w-0 flex-1">
          <h2 id="tidy-preview-title" className="font-serif text-2xl">
            Así quedaría la página
          </h2>
          <p className="text-sm text-ink-muted">
            La IA puede equivocarse: échale un vistazo antes de aplicarlo. Las imágenes, notas, tablas y código no los
            toca, solo los cambia de sitio.
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar sin aplicar"
          onClick={() => dialog.current?.close()}
          className="-mr-2 grid size-11 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-panel hover:text-ink"
        >
          <X size={20} strokeWidth={1.5} aria-hidden />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8">
        <NotebookEditor {...page} initialContent={blocks} editable={false} onChange={noop} preview />
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-dashed border-border px-5 py-3 md:px-8">
        {changedMeanwhile ? (
          <p role="alert" className="w-full text-sm text-error">
            La página ha cambiado mientras la IA trabajaba. Si lo aplicas, se perderán esos cambios.
          </p>
        ) : null}
        <Button onClick={onApply} autoFocus>
          {changedMeanwhile ? "Aplicar de todos modos" : "Aplicar"}
        </Button>
        <Button variant="ghost" onClick={() => dialog.current?.close()}>
          Descartar
        </Button>
        <span className="ml-auto font-hand text-lg text-ink-muted">
          {remaining === 1 ? "te queda 1 más hoy" : `te quedan ${remaining} más hoy`}
        </span>
      </footer>
    </dialog>
  );
}
