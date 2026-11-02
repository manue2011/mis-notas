"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { StickyNote } from "@/components/ui/StickyNote";

/** A yellow sticky note pinned in the accent color. Its text is the block's content. */
export const stickyNoteBlock = createReactBlockSpec(
  {
    type: "stickyNote",
    propSchema: {},
    content: "inline",
  },
  {
    render: ({ contentRef }) => (
      <div className="sticky-note-block my-6 flex w-full justify-end pr-4">
        <StickyNote className="w-80 max-w-full" rotate={1.2}>
          <div ref={contentRef} className="sticky-note-text relative min-h-[2lh] leading-snug" />
        </StickyNote>
      </div>
    ),
  },
)();
