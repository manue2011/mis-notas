"use client";

import { useCallback, useSyncExternalStore } from "react";
import type * as Y from "yjs";
import { TITLE_TEXT } from "@/lib/realtime/doc";

/**
 * The page title as shared text. Edits are applied as the smallest change
 * (common start and end kept), so two people typing in it both keep theirs.
 */
export function useSharedTitle(doc: Y.Doc) {
  const text = doc.getText(TITLE_TEXT);

  const subscribe = useCallback(
    (listener: () => void) => {
      text.observe(listener);
      return () => text.unobserve(listener);
    },
    [text],
  );
  const title = useSyncExternalStore(subscribe, () => text.toString(), () => "");

  const setTitle = useCallback(
    (next: string) => {
      const current = text.toString();
      if (next === current) return;
      let start = 0;
      while (start < current.length && start < next.length && current[start] === next[start]) start++;
      let end = 0;
      while (
        end < current.length - start &&
        end < next.length - start &&
        current[current.length - 1 - end] === next[next.length - 1 - end]
      ) {
        end++;
      }
      doc.transact(() => {
        text.delete(start, current.length - start - end);
        text.insert(start, next.slice(start, next.length - end));
      });
    },
    [doc, text],
  );

  return [title, setTitle] as const;
}
