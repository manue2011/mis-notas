"use client";

import "@blocknote/core/style.css";
import "@blocknote/ariakit/style.css";
import "./notebook-editor.css";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";
import { filterSuggestionItems } from "@blocknote/core";
import { CollaborationExtension } from "@blocknote/core/yjs";
import { BlockNoteView } from "@blocknote/ariakit";
import { syntaxHighlighter } from "@blocknote/code-block";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { uploadImage, UploadError } from "@/lib/assets/upload-client";
import type { FlatPage } from "@/lib/pages/tree";
import { importPdfFile, PdfImportClientError } from "@/lib/pdf/import-client";
import { EditorContext, type PageEditorContext } from "./editor-context";
import { PagePreviewLayer } from "./inline/PagePreviewLayer";
import { mentionMenuItems } from "./mention-menu";
import { pdfImportStore } from "./pdf-import-store";
import { PdfImportStatus } from "./PdfImportStatus";
import { pageDictionary, pageSchema, type PageBlock, type PageEditor } from "./schema";
import { slashMenuItems } from "./slash-menu";
import { uploadStore } from "./upload-store";

export type NotebookEditorHandle = { focus: () => void };

type Props = {
  organizationId: string;
  slug: string;
  pageId: string;
  /** Live pages of the workspace, for "@" links. */
  pages: FlatPage[];
  /** Source of the RegExp a screenshot's url must match to be shown. */
  ownImagePattern: string | null;
  /** Real-time editing: the shared document replaces initialContent and onChange. */
  collaboration?: {
    fragment: Y.XmlFragment;
    provider: HocuspocusProvider;
    /** Shown to the others: cursor label and colour, avatar (by id). */
    user: { id: string; name: string; color: string };
  };
  initialContent: unknown[];
  editable: boolean;
  onChange: (blocks: unknown[]) => void;
  onReady?: (handle: NotebookEditorHandle) => void;
};

/** BlockNote dressed as a notebook page. Client-only; load it with next/dynamic. */
export default function NotebookEditor(props: Props) {
  const { organizationId, slug, pageId, pages, ownImagePattern, initialContent, editable, onChange, onReady } = props;
  const { collaboration } = props;
  const uploadRef = useRef<((blockId: string, file: File) => void) | null>(null);
  const editor: PageEditor = useCreateBlockNote({
    schema: pageSchema,
    dictionary: pageDictionary,
    ...(collaboration
      ? {
          // What BlockNote's withCollaboration() does: bind the editor to the
          // shared document and swap the normal undo history for Yjs's.
          extensions: [
            syntaxHighlighter,
            CollaborationExtension({
              fragment: collaboration.fragment,
              user: collaboration.user,
              // Awareness carries everyone's cursor and name.
              provider: { awareness: collaboration.provider.awareness ?? undefined },
              showCursorLabels: "activity",
            }),
          ],
          disableExtensions: ["history"],
          initialContent: [{ type: "paragraph", id: "initialBlockId" }],
        }
      : {
          extensions: [syntaxHighlighter],
          // The server validated it against the same block types. An empty array
          // isn't valid initial content; undefined gives one empty paragraph.
          initialContent: initialContent.length ? (initialContent as PageBlock[]) : undefined,
        }),
    pasteHandler: ({ event, editor, defaultPasteHandler }) => {
      const file = imageFromClipboard(event);
      if (!file || !editable) return defaultPasteHandler();
      const current = editor.getTextCursorPosition().block;
      const [inserted] = editor.insertBlocks([{ type: "screenshot" }], current, "after");
      uploadRef.current?.(inserted.id, file);
      return true;
    },
  });

  const uploadInto = useCallback(
    (blockId: string, file: File) => {
      uploadStore.set(blockId, { progress: 0, error: null });
      uploadImage(file, { organizationId, pageId }, (progress) =>
        uploadStore.set(blockId, { progress, error: null }),
      )
        .then((image) => {
          // The block may have been deleted while uploading.
          if (editor.getBlock(blockId)) {
            editor.updateBlock(blockId, {
              props: { url: image.url, assetId: image.assetId, width: image.width, height: image.height },
            });
          }
          uploadStore.clear(blockId);
        })
        .catch((error: unknown) => {
          uploadStore.set(blockId, {
            progress: 0,
            error: error instanceof UploadError ? error.message : "No se ha podido subir la imagen.",
          });
        });
    },
    [editor, organizationId, pageId],
  );
  // The paste handler is created once with the editor; it reads the latest uploader.
  useEffect(() => {
    uploadRef.current = uploadInto;
  }, [uploadInto]);

  useEffect(() => {
    onReady?.({ focus: () => editor.focus() });
  }, [editor, onReady]);

  // "/ Importar PDF": the blocks go where the menu was opened.
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pdfTargetRef = useRef<string | null>(null);
  const choosePdf = useCallback(() => {
    const busy = pdfImportStore.get();
    if (busy?.phase === "uploading" || busy?.phase === "reading") return;
    pdfTargetRef.current = editor.getTextCursorPosition().block.id;
    pdfInputRef.current?.click();
  }, [editor]);

  const importPdf = useCallback(
    (file: File) => {
      const fileName = file.name;
      importPdfFile(file, { organizationId, pageId }, (step) => pdfImportStore.set({ fileName, ...step }))
        .then((result) => {
          const blocks = result.blocks as PageBlock[];
          const target = pdfTargetRef.current ? editor.getBlock(pdfTargetRef.current) : undefined;
          const empty = target?.type === "paragraph" && (target.content as unknown[]).length === 0;
          if (target && empty) editor.replaceBlocks([target], blocks);
          else editor.insertBlocks(blocks, target ?? editor.document[editor.document.length - 1], "after");
          pdfImportStore.set({ fileName, phase: "done", pages: result.pages, images: result.images });
        })
        .catch((error: unknown) => {
          const message =
            error instanceof PdfImportClientError ? error.message : "No se ha podido importar el PDF.";
          pdfImportStore.set({ fileName, phase: "error", error: message });
        });
    },
    [editor, organizationId, pageId],
  );

  const context = useMemo<PageEditorContext>(
    () => ({
      editable,
      uploadInto,
      organizationId,
      slug,
      pages,
      ownImagePattern: ownImagePattern ? new RegExp(ownImagePattern) : null,
    }),
    [editable, uploadInto, organizationId, slug, pages, ownImagePattern],
  );

  return (
    <EditorContext value={context}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme="light"
        slashMenu={false}
        // With collaboration the real-time server saves; nothing to do here.
        onChange={() => !collaboration && onChange(editor.document)}
        className="notebook-editor"
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => filterSuggestionItems(slashMenuItems(editor, { choosePdf }), query)}
        />
        <SuggestionMenuController
          triggerCharacter="@"
          getItems={async (query) => mentionMenuItems(editor, pages, pageId, query)}
        />
      </BlockNoteView>
      <PagePreviewLayer organizationId={organizationId} pages={pages} />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = ""; // so the same file can be picked again
          if (file) importPdf(file);
        }}
      />
      <PdfImportStatus />
    </EditorContext>
  );
}

function imageFromClipboard(event: ClipboardEvent): File | null {
  const files = event.clipboardData?.files;
  if (!files) return null;
  return Array.from(files).find((f) => f.type.startsWith("image/")) ?? null;
}
