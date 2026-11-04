"use client";

import { useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { savePageContentAction, savePageTitleAction } from "@/lib/pages/actions";
import type { FlatPage } from "@/lib/pages/tree";
import type { NotebookEditorHandle } from "./editor/NotebookEditor";
import { PageMeta } from "./PageMeta";
import { PageTitle } from "./PageTitle";
import { useAutosave, type SaveStatus } from "./useAutosave";

// ProseMirror needs the DOM, so the editor only renders in the browser.
const NotebookEditor = dynamic(() => import("./editor/NotebookEditor"), {
  ssr: false,
  loading: () => <div className="ruled min-h-40 font-serif text-lg text-ink-muted/60">Abriendo la página…</div>,
});

type Props = {
  organizationId: string;
  slug: string;
  pageId: string;
  pages: FlatPage[];
  title: string;
  content: unknown[];
  updatedAt: string;
  updatedByName: string | null;
  editable: boolean;
};

const priority: SaveStatus[] = ["error", "saving", "pending", "saved", "idle"];

export function PageView(props: Props) {
  const { organizationId, slug, pageId, pages, title, content, updatedAt, updatedByName, editable } = props;
  const editorRef = useRef<NotebookEditorHandle | null>(null);

  const titleSave = useAutosave(
    useCallback((value: string) => savePageTitleAction(organizationId, pageId, value), [organizationId, pageId]),
  );
  const contentSave = useAutosave(
    useCallback(
      (value: unknown[]) => savePageContentAction(organizationId, pageId, value),
      [organizationId, pageId],
    ),
  );

  // One status line for both: the most important of the two wins.
  const status = priority.find((s) => s === titleSave.status || s === contentSave.status) ?? "idle";
  const lastSaved = [titleSave.savedAt, contentSave.savedAt, updatedAt].filter(Boolean).sort().at(-1)!;
  const handleReady = useCallback((handle: NotebookEditorHandle) => {
    editorRef.current = handle;
  }, []);

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 md:px-16 md:py-14">
      <PageTitle
        initialTitle={title}
        editable={editable}
        onChange={titleSave.schedule}
        onEnter={() => editorRef.current?.focus()}
      />
      <PageMeta
        editorName={titleSave.savedAt || contentSave.savedAt ? "ti" : updatedByName}
        updatedAt={lastSaved}
        status={status}
        error={titleSave.error ?? contentSave.error}
      />
      <div className="mt-8">
        <NotebookEditor
          organizationId={organizationId}
          slug={slug}
          pageId={pageId}
          pages={pages}
          initialContent={content}
          editable={editable}
          onChange={contentSave.schedule}
          onReady={handleReady}
        />
      </div>
    </article>
  );
}
