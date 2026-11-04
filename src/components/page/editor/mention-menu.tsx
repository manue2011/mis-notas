"use client";

import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { FileText } from "lucide-react";
import { foldText, searchTerms } from "@/lib/pages/search-terms";
import { ancestorsOf, type FlatPage } from "@/lib/pages/tree";
import type { PageEditor } from "./schema";

const MAX_ITEMS = 10;

/** The "@" menu: pages of the workspace whose title has every typed word. */
export function mentionMenuItems(
  editor: PageEditor,
  pages: FlatPage[],
  currentPageId: string,
  query: string,
): DefaultReactSuggestionItem[] {
  const terms = searchTerms(query);
  return pages
    .filter((p) => p.id !== currentPageId)
    .filter((p) => terms.every((term) => foldText(p.title).includes(term)))
    .slice(0, MAX_ITEMS)
    .map((p) => {
      const path = ancestorsOf(pages, p.id)
        .map((a) => a.title || "Sin título")
        .join(" / ");
      return {
        title: p.title || "Sin título",
        subtext: path || undefined,
        icon: <FileText size={18} strokeWidth={1.5} aria-hidden />,
        onItemClick: () =>
          editor.insertInlineContent([{ type: "pageLink", props: { pageId: p.id, title: p.title } }, " "]),
      };
    });
}
