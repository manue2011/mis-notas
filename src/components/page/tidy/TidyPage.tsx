"use client";

import { useEffect, useState, useTransition, type RefObject } from "react";
import { ListTree } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { tidyPageAction } from "@/lib/ai/actions";
import { tidyBlocks } from "@/lib/ai/tidy-client";
import { toTidyMarkdown, type TidyBlock } from "@/lib/ai/tidy-markdown";
import type { NotebookEditorHandle } from "../editor/NotebookEditor";
import type { PageBlock } from "../editor/schema";
import { TidyPreview, type TidyPreviewProps } from "./TidyPreview";

type Props = Pick<TidyPreviewProps, "organizationId" | "slug" | "pageId" | "pages" | "ownImagePattern"> & {
  title: string;
  editorRef: RefObject<NotebookEditorHandle | null>;
};

type Proposal = { before: PageBlock[]; after: PageBlock[]; remaining: number };

/** How long "Deshacer" stays after applying. */
const UNDO_MS = 60_000;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * "Ordenar página": the AI proposes a tidier version, the person looks at it
 * and applies it (or not), and can undo it for a minute afterwards.
 */
export function TidyPage({ title, editorRef, ...previewProps }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [undo, setUndo] = useState<{ before: PageBlock[]; after: PageBlock[] } | null>(null);
  const [changedMeanwhile, setChangedMeanwhile] = useState(false);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  function ask() {
    const editor = editorRef.current;
    if (!editor) return;
    setError(null);
    setUndo(null);
    const before = editor.getDocument();
    startTransition(async () => {
      const result = await tidyPageAction(previewProps.organizationId, previewProps.pageId, title, before);
      if (!result.ok) return setError(result.error);
      // Rebuilt from the same blocks, so its markers match the server's.
      const source = toTidyMarkdown(before as TidyBlock[]);
      const after = tidyBlocks(result.markdown, source, editor.parseMarkdown) as PageBlock[];
      setChangedMeanwhile(false);
      setProposal({ before, after, remaining: result.remaining });
    });
  }

  function apply() {
    const editor = editorRef.current;
    if (!editor || !proposal) return;
    // Someone (or you, in another tab) wrote while the AI worked.
    if (!changedMeanwhile && !same(editor.getDocument(), proposal.before)) return setChangedMeanwhile(true);
    editor.replaceDocument(proposal.after);
    setUndo({ before: proposal.before, after: editor.getDocument() });
    setProposal(null);
  }

  function revert() {
    const editor = editorRef.current;
    if (!editor || !undo) return;
    editor.replaceDocument(undo.before);
    setUndo(null);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {undo ? (
        <p role="status" className="flex flex-wrap items-center gap-x-2 text-ink-muted">
          Página ordenada.
          <button
            type="button"
            onClick={revert}
            className="min-h-11 rounded-md px-2 font-medium text-accent underline-offset-4 hover:underline"
          >
            Deshacer
          </button>
        </p>
      ) : (
        <button
          type="button"
          onClick={ask}
          disabled={pending}
          aria-busy={pending || undefined}
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-ink-muted hover:bg-panel hover:text-ink disabled:cursor-wait"
        >
          <ListTree size={16} strokeWidth={1.5} aria-hidden />
          {pending ? "Ordenando la página…" : "Ordenar página con IA"}
        </button>
      )}
      <FormAlert message={error} />
      {proposal ? (
        <TidyPreview
          {...previewProps}
          blocks={proposal.after}
          remaining={proposal.remaining}
          changedMeanwhile={changedMeanwhile}
          onApply={apply}
          onClose={() => setProposal(null)}
        />
      ) : null}
    </div>
  );
}
