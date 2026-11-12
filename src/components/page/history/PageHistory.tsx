"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { History, X } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import {
  getPageVersionAction,
  listPageVersionsAction,
  recordPageVersionAction,
  type PageVersionDetail,
  type PageVersionSummary,
} from "@/lib/pages/version-actions";
import type { FlatPage } from "@/lib/pages/tree";
import type { NotebookEditorHandle } from "../editor/NotebookEditor";
import type { PageBlock } from "../editor/schema";
import { VersionList } from "./VersionList";
import { VersionPreview } from "./VersionPreview";

type Props = {
  organizationId: string;
  slug: string;
  pageId: string;
  pages: FlatPage[];
  ownImagePattern: string | null;
  /** The page's editor, to restore a version into; restoring is offered when it can edit. */
  editorRef: RefObject<NotebookEditorHandle | null>;
  canRestore: boolean;
};

/** "Historial" next to "Editado por…": who changed the page, when, and what. */
export function PageHistory(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-my-2.5 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1.5 text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <History size={15} strokeWidth={1.5} aria-hidden />
        Historial
      </button>
      {open ? <HistoryDialog {...props} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function HistoryDialog({ editorRef, canRestore, onClose, ...page }: Props & { onClose: () => void }) {
  const { organizationId, pageId } = page;
  const dialog = useRef<HTMLDialogElement>(null);
  const [versions, setVersions] = useState<PageVersionSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, PageVersionDetail>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    listPageVersionsAction(organizationId, pageId).then((result) => {
      if (!result.ok) return setError(result.error);
      setVersions(result.data);
      setSelectedId(result.data[0]?.id ?? null);
    });
  }, [organizationId, pageId]);

  useEffect(() => {
    if (!selectedId || details[selectedId]) return;
    let current = true;
    getPageVersionAction(organizationId, pageId, selectedId).then((result) => {
      if (!current) return;
      if (!result.ok) return setError(result.error);
      setError(null);
      setDetails((all) => ({ ...all, [result.data.id]: result.data }));
    });
    return () => {
      current = false;
    };
  }, [organizationId, pageId, selectedId, details]);

  const selected = selectedId ? details[selectedId] : undefined;

  function restore() {
    const editor = editorRef.current;
    if (!editor || !selected) return;
    editor.replaceDocument(selected.content as PageBlock[]);
    // Shown as a restore in the history; the editor's own save folds into it.
    void recordPageVersionAction(organizationId, pageId, "restore", editor.getDocument());
    dialog.current?.close();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="page-history-title"
      onClose={onClose}
      className="m-auto hidden max-h-[min(52rem,calc(100dvh-2rem))] w-[min(64rem,calc(100vw-2rem))] flex-col rounded-xl border border-border bg-paper p-0 open:flex text-ink shadow-paper backdrop:bg-[rgb(20_17_14/0.4)]"
    >
      <header className="flex items-start gap-3 border-b border-dashed border-border px-5 py-3 md:px-8">
        <div className="min-w-0 flex-1">
          <h2 id="page-history-title" className="font-serif text-2xl">
            Historial de la página
          </h2>
          <p className="text-sm text-ink-muted">
            Una versión por cada rato de edición de cada persona. Se guardan 30 días.
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar el historial"
          onClick={() => dialog.current?.close()}
          className="-mr-2 grid size-11 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-panel hover:text-ink"
        >
          <X size={20} strokeWidth={1.5} aria-hidden />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[15rem_1fr] md:grid-rows-1">
        <nav
          aria-label="Versiones de la página"
          className="max-h-44 overflow-y-auto border-b border-dashed border-border p-2 md:max-h-none md:border-r md:border-b-0"
        >
          {versions === null ? (
            error ? null : (
              <p className="px-3 py-2 font-hand text-lg text-ink-muted">buscando en el cajón…</p>
            )
          ) : versions.length ? (
            <VersionList versions={versions} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <p className="px-3 py-2 text-sm text-ink-muted">
              <span className="block font-hand text-xl text-ink">Aún no hay historial.</span>
              Empieza a guardarse con el próximo cambio.
            </p>
          )}
        </nav>
        <div className="min-h-0 overflow-y-auto px-5 py-4 md:px-8">
          <FormAlert message={error} />
          {selected ? (
            <VersionPreview
              {...page}
              version={selected}
              isCurrent={selected.id === versions?.[0]?.id}
              onRestore={canRestore ? restore : undefined}
            />
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
