"use client";

import { useEffect, useState } from "react";
import { getPagePreviewAction, type PagePreview } from "@/lib/pages/preview-actions";
import { formatDate } from "@/lib/format";
import { ancestorsOf, type FlatPage } from "@/lib/pages/tree";

// Previews already fetched in this visit, so hovering again is instant.
const cache = new Map<string, PagePreview | null>();

type Props = {
  organizationId: string;
  pageId: string;
  pages: FlatPage[];
  /** Viewport position, just under the link. */
  at: { top: number; left: number };
};

/** The card under a page link while the pointer rests on it. */
export function PagePreviewCard({ organizationId, pageId, pages, at }: Props) {
  const [preview, setPreview] = useState<PagePreview | null | undefined>(() => cache.get(pageId));

  useEffect(() => {
    if (cache.has(pageId)) return;
    let stale = false;
    getPagePreviewAction(organizationId, pageId)
      .catch(() => null)
      .then((result) => {
        cache.set(pageId, result);
        if (!stale) setPreview(result);
      });
    return () => {
      stale = true;
    };
  }, [organizationId, pageId]);

  const path = ancestorsOf(pages, pageId)
    .map((p) => p.title || "Sin título")
    .join(" / ");

  return (
    <div
      role="tooltip"
      style={{ top: at.top, left: `min(${at.left}px, calc(100vw - 20rem - 1rem))` }}
      className="pointer-events-none fixed z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-1.5 rounded-lg border border-border bg-surface p-4 font-sans text-sm leading-snug text-ink shadow-paper"
    >
      {path ? <span className="truncate text-xs text-ink-muted">{path}</span> : null}
      {preview === undefined ? (
        <span className="font-hand text-lg text-ink-muted">hojeando…</span>
      ) : preview === null ? (
        <span className="text-ink-muted">No hemos podido abrir esta página.</span>
      ) : (
        <>
          <span className="font-serif text-lg leading-tight font-medium">{preview.title || "Sin título"}</span>
          <span className="line-clamp-4 font-serif text-base text-ink-muted">
            {preview.excerpt || "Todavía está en blanco."}
          </span>
          <span className="text-xs text-ink-muted">
            Editada el {formatDate(new Date(preview.updatedAt))}
            {preview.updatedByName ? ` por ${preview.updatedByName}` : ""}
          </span>
        </>
      )}
    </div>
  );
}
