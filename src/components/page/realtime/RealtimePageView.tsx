"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type * as Y from "yjs";
import { personColor } from "@/lib/realtime/colors";
import { CONTENT_FRAGMENT } from "@/lib/realtime/doc";
import type { FlatPage } from "@/lib/pages/tree";
import type { NotebookEditorHandle } from "../editor/NotebookEditor";
import { PageMeta } from "../PageMeta";
import { PageTitle } from "../PageTitle";
import { TidyPage } from "../tidy/TidyPage";
import type { SessionState } from "./session-store";
import { usePageSession } from "./usePageSession";
import { useSharedTitle } from "./useSharedTitle";

const NotebookEditor = dynamic(() => import("../editor/NotebookEditor"), {
  ssr: false,
  loading: () => <div className="ruled min-h-40 font-serif text-lg text-ink-muted/60">Abriendo la página…</div>,
});

export type RealtimeConfig = { url: string; user: { id: string; name: string } };

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
  ownImagePattern: string | null;
  realtime: RealtimeConfig;
  canTidy: boolean;
};

const noop = () => {};

/** What the line under the title says about the connection. */
function describe(state: SessionState | null): { text: string; tone?: "error" } {
  if (state?.refusal === "denied") return { text: "Ya no tienes acceso a esta página.", tone: "error" };
  if (state?.refusal === "unavailable") {
    return { text: "No se pudo abrir la página. Prueba a recargar en un rato.", tone: "error" };
  }
  if (!state?.synced) return { text: "Conectando…" };
  if (state.status === "disconnected" || state.status === "connecting") {
    return state.unsynced > 0
      ? { text: "Sin conexión: tus cambios se enviarán al volver", tone: "error" }
      : { text: "Sin conexión, reconectando…" };
  }
  return state.unsynced > 0 ? { text: "Guardando…" } : { text: "En vivo" };
}

/**
 * A page edited by several people at once. Until the server sends the shared
 * document, the saved version is shown read-only, so nobody types into an
 * empty document that would then be merged with the real one.
 */
export function RealtimePageView(props: Props) {
  const { organizationId, slug, pageId, pages, title, content, editable, ownImagePattern, realtime, canTidy } = props;
  const { session, state } = usePageSession({ url: realtime.url, organizationId, pageId });
  const editorRef = useRef<NotebookEditorHandle | null>(null);
  const handleReady = useCallback((handle: NotebookEditorHandle) => {
    editorRef.current = handle;
  }, []);
  const live = session && state?.synced ? session : null;
  const canEdit = editable && !state?.refusal;

  // Closing the tab with changes the server hasn't got yet: ask first.
  const unsynced = state?.unsynced ?? 0;
  useEffect(() => {
    if (unsynced === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsynced]);

  const editorProps = { organizationId, slug, pageId, pages, ownImagePattern, onReady: handleReady };

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 md:px-16 md:py-14">
      {live ? (
        <LiveTitle doc={live.doc} editable={canEdit} onEnter={() => editorRef.current?.focus()} />
      ) : (
        <PageTitle initialTitle={title} editable={false} onChange={noop} onEnter={noop} />
      )}
      <PageMeta
        liveStatus={describe(state)}
        editorName={props.updatedByName}
        updatedAt={props.updatedAt}
        status="idle"
        error={null}
      />
      {live && canEdit && canTidy ? (
        <TidyPage {...{ organizationId, slug, pageId, pages, ownImagePattern, title }} editorRef={editorRef} />
      ) : null}
      <div className="mt-8">
        {live ? (
          <NotebookEditor
            key="live"
            {...editorProps}
            initialContent={[]}
            editable={canEdit}
            onChange={noop}
            collaboration={{
              fragment: live.doc.getXmlFragment(CONTENT_FRAGMENT),
              provider: live.provider,
              user: { id: realtime.user.id, name: realtime.user.name, color: personColor(realtime.user.id) },
            }}
          />
        ) : (
          <NotebookEditor key="saved" {...editorProps} initialContent={content} editable={false} onChange={noop} />
        )}
      </div>
    </article>
  );
}

const SIDEBAR_REFRESH_MS = 3500;

/**
 * The shared title. When it changes, yours or someone else's, the sidebar
 * catches up once the server has saved it.
 */
function LiveTitle({ doc, editable, onEnter }: { doc: Y.Doc; editable: boolean; onEnter: () => void }) {
  const [title, setTitle] = useSharedTitle(doc);
  const router = useRouter();
  const shown = useRef(title);

  useEffect(() => {
    if (title === shown.current) return;
    shown.current = title;
    const timer = setTimeout(() => router.refresh(), SIDEBAR_REFRESH_MS);
    return () => clearTimeout(timer);
  }, [title, router]);

  return <PageTitle initialTitle={title} value={title} editable={editable} onEnter={onEnter} onChange={setTitle} />;
}
