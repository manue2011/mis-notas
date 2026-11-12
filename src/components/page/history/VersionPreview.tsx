"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import type { PageVersionDetail } from "@/lib/pages/version-actions";
import type { FlatPage } from "@/lib/pages/tree";
import type { VersionDiff } from "@/lib/pages/version-diff";
import { versionWhat, versionWho } from "./version-labels";

const NotebookEditor = dynamic(() => import("../editor/NotebookEditor"), {
  ssr: false,
  loading: () => <div className="ruled min-h-40 font-serif text-lg text-ink-muted/60">Pasando las hojas…</div>,
});

type Props = {
  organizationId: string;
  slug: string;
  pageId: string;
  pages: FlatPage[];
  ownImagePattern: string | null;
  version: PageVersionDetail;
  /** Whether it's the page as it is now (nothing to restore). */
  isCurrent: boolean;
  /** Present when the person may restore it. */
  onRestore?: () => void;
};

const noop = () => {};
const SAFE_ID = /^[\w-]+$/;

/** Highlighter marks on the blocks that are new or changed in this version. */
function diffStyle(diff: VersionDiff | null): string {
  if (!diff) return "";
  return Object.entries(diff.marks)
    .filter(([id]) => SAFE_ID.test(id))
    .map(
      ([id, change]) =>
        `.version-preview .bn-block[data-id="${id}"] > .bn-block-content { background: ${
          change === "added" ? "var(--version-added)" : "var(--version-changed)"
        }; border-radius: 3px; }`,
    )
    .join("\n");
}

/** One version, read-only, with what it changed from the one before. */
export function VersionPreview({ version, isCurrent, onRestore, ...page }: Props) {
  const { diff } = version;
  const marks = diff ? Object.values(diff.marks) : [];
  const added = marks.filter((m) => m === "added").length;
  const changed = marks.length - added;
  const what = versionWhat(version);

  return (
    <div className="version-preview">
      <style>{diffStyle(diff)}</style>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="min-w-0 flex-1 text-sm text-ink-muted">
          <span className="font-medium text-ink">{versionWho(version)}</span>
          {what ? ` ${what}` : ""}
          {diff ? (
            <>
              {added ? <Swatch kind="added">{added === 1 ? "1 bloque nuevo" : `${added} bloques nuevos`}</Swatch> : null}
              {changed ? <Swatch kind="changed">{changed === 1 ? "1 cambiado" : `${changed} cambiados`}</Swatch> : null}
              {diff.removed.length ? ` · ${diff.removed.length} quitado${diff.removed.length === 1 ? "" : "s"}` : null}
              {diff.titleChanged ? " · título cambiado" : null}
              {!marks.length && !diff.removed.length && !diff.titleChanged ? " · sin cambios de texto" : null}
            </>
          ) : (
            " · así estaba cuando empezó el historial"
          )}
        </p>
        {onRestore && !isCurrent ? (
          <Button variant="ghost" onClick={onRestore} className="shrink-0">
            Restaurar esta versión
          </Button>
        ) : null}
      </div>

      {diff?.removed.length ? (
        <div className="mt-3 rounded-md bg-panel px-3 py-2 text-sm">
          <p className="font-hand text-lg leading-tight text-ink-muted">quitado en esta versión</p>
          <ul className="mt-1 space-y-0.5 text-ink-muted">
            {diff.removed.map((text, i) => (
              <li key={i} className="line-through decoration-error/60">
                {text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <h3 className="mt-5 font-serif text-3xl">{version.title || "Sin título"}</h3>
      <div className="mt-4">
        <NotebookEditor
          key={version.id}
          {...page}
          initialContent={version.content}
          editable={false}
          onChange={noop}
          preview
        />
      </div>
    </div>
  );
}

function Swatch({ kind, children }: { kind: "added" | "changed"; children: React.ReactNode }) {
  return (
    <>
      {" · "}
      <span
        className="rounded-sm px-1 text-ink"
        style={{ background: kind === "added" ? "var(--version-added)" : "var(--version-changed)" }}
      >
        {children}
      </span>
    </>
  );
}
