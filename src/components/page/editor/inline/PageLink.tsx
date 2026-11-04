"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { z } from "zod";
import { usePageEditor } from "../editor-context";
import { previewStore } from "./preview-store";

const isUuid = (value: string) => z.uuid().safeParse(value).success;

type Props = { pageId: string; savedTitle: string };

/** No state of its own: see preview-store.ts. */
export function PageLink({ pageId, savedTitle }: Props) {
  const { slug, pages } = usePageEditor();
  const router = useRouter();

  const target = pages.find((p) => p.id === pageId);
  const title = (target ? target.title : savedTitle) || "Sin título";

  // Deleted (or never valid): keep the words, drop the link.
  if (!target || !isUuid(pageId)) {
    return (
      <span className="page-link page-link--gone" title="Esta página ya no existe o está en la papelera">
        <FileText size={15} strokeWidth={1.5} aria-hidden />
        {title}
      </span>
    );
  }

  const href = `/espacio/${slug}/p/${pageId}`;
  // Inside the editable area the browser won't follow links on its own.
  const open = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    previewStore.hide();
    router.push(href);
  };

  return (
    <a
      href={href}
      onClick={open}
      onMouseEnter={(e) => previewStore.showSoon(pageId, e.currentTarget)}
      onMouseLeave={() => previewStore.hide()}
      className="page-link"
    >
      <FileText size={15} strokeWidth={1.5} aria-hidden />
      {title}
    </a>
  );
}
