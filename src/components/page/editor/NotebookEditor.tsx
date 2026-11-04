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
import { EditorContext, type PageEditorContext } from "./editor-context";
import { PagePreviewLayer } from "./inline/PagePreviewLayer";
import { mentionMenuItems } from "./mention-menu";
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
    user: { name: string; color: string };
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
          getItems={async (query) => filterSuggestionItems(slashMenuItems(editor), query)}
        />
        <SuggestionMenuController
          triggerCharacter="@"
          getItems={async (query) => mentionMenuItems(editor, pages, pageId, query)}
        />
      </BlockNoteView>
      <PagePreviewLayer organizationId={organizationId} pages={pages} />
    </EditorContext>
  );
}

function imageFromClipboard(event: ClipboardEvent): File | null {
  const files = event.clipboardData?.files;
  if (!files) return null;
  return Array.from(files).find((f) => f.type.startsWith("image/")) ?? null;
}
