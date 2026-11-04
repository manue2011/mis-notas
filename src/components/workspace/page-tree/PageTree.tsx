"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { FormAlert } from "@/components/auth/FormAlert";
import { MarginNote } from "@/components/ui/MarginNote";
import { ancestorsOf, buildTree, type FlatPage } from "@/lib/pages/tree";
import { useExpandedPages } from "./expanded-store";
import { PageTreeItem } from "./PageTreeItem";
import { PageTreeContext, type PageTreeContextValue } from "./tree-context";
import { usePageDrag } from "./usePageDrag";

type Props = {
  organizationId: string;
  slug: string;
  pages: FlatPage[];
  canCreate: boolean;
  canMove: boolean;
};

export function PageTree({ organizationId, slug, pages, canCreate, canMove }: Props) {
  const pathname = usePathname();
  const currentId = pathname.match(/\/p\/([0-9a-f-]{36})/)?.[1] ?? null;
  const { expanded, setOpen } = useExpandedPages(organizationId);
  const drag = usePageDrag({ organizationId, pages, expanded, setOpen });
  const tree = useMemo(() => buildTree(drag.pages), [drag.pages]);

  // Opening a page (from a link, search…) unfolds the branches above it.
  useEffect(() => {
    if (!currentId) return;
    const ancestors = ancestorsOf(pages, currentId).map((p) => p.id);
    if (ancestors.length) setOpen(ancestors, true);
  }, [currentId, pages, setOpen]);

  if (pages.length === 0) {
    return <MarginNote className="px-2 text-lg">aún no hay ninguna página</MarginNote>;
  }

  const context: PageTreeContextValue = {
    slug,
    organizationId,
    currentId,
    expanded,
    setOpen,
    canCreate,
    canMove,
    draggingId: drag.draggingId,
    dropTarget: drag.dropTarget,
    onDragStart: drag.onDragStart,
    onDragOver: drag.onDragOver,
    onDrop: drag.onDrop,
    onDragEnd: drag.onDragEnd,
  };

  return (
    <PageTreeContext value={context}>
      <nav aria-label="Páginas">
        <ul className="flex flex-col gap-0.5">
          {tree.map((node) => (
            <PageTreeItem key={node.id} node={node} depth={0} />
          ))}
        </ul>
        <FormAlert message={drag.error} />
      </nav>
    </PageTreeContext>
  );
}
