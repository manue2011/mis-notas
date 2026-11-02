"use client";

import "@blocknote/core/style.css";
import "@blocknote/ariakit/style.css";
import "./notebook-editor.css";

import { useEffect } from "react";
import { BlockNoteView } from "@blocknote/ariakit";
import { useCreateBlockNote } from "@blocknote/react";
import { pageDictionary, pageSchema } from "./schema";

type PageBlock = (typeof pageSchema)["PartialBlock"];

export type NotebookEditorHandle = { focus: () => void };

type Props = {
  initialContent: unknown[];
  editable: boolean;
  onChange: (blocks: unknown[]) => void;
  onReady?: (handle: NotebookEditorHandle) => void;
};

/** BlockNote dressed as a notebook page. Client-only; load it with next/dynamic. */
export default function NotebookEditor({ initialContent, editable, onChange, onReady }: Props) {
  const editor = useCreateBlockNote({
    schema: pageSchema,
    dictionary: pageDictionary,
    // An empty array isn't valid initial content; undefined gives one empty paragraph.
    // The server validated it against the same block types.
    initialContent: initialContent.length ? (initialContent as PageBlock[]) : undefined,
  });

  useEffect(() => {
    onReady?.({ focus: () => editor.focus() });
  }, [editor, onReady]);

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme="light"
      onChange={() => onChange(editor.document)}
      className="notebook-editor"
    />
  );
}
