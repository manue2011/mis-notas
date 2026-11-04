"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { MarginNote } from "@/components/ui/MarginNote";
import { ancestorsOf, buildTree, type FlatPage } from "@/lib/pages/tree";
import { useExpandedPages } from "./expanded-store";
import { PageTreeItem } from "./PageTreeItem";

type Props = {
  organizationId: string;
  slug: string;
  pages: FlatPage[];
  canCreate: boolean;
};

export function PageTree({ organizationId, slug, pages, canCreate }: Props) {
  const pathname = usePathname();
  const currentId = pathname.match(/\/p\/([0-9a-f-]{36})/)?.[1] ?? null;
  const tree = useMemo(() => buildTree(pages), [pages]);
  const { expanded, setOpen } = useExpandedPages(organizationId);

  // Opening a page (from a link, search…) unfolds the branches above it.
  useEffect(() => {
    if (!currentId) return;
    const ancestors = ancestorsOf(pages, currentId).map((p) => p.id);
    if (ancestors.length) setOpen(ancestors, true);
  }, [currentId, pages, setOpen]);

  if (pages.length === 0) {
    return <MarginNote className="px-2 text-lg">aún no hay ninguna página</MarginNote>;
  }

  return (
    <nav aria-label="Páginas">
      <ul className="flex flex-col gap-0.5">
        {tree.map((node) => (
          <PageTreeItem
            key={node.id}
            node={node}
            depth={0}
            slug={slug}
            organizationId={organizationId}
            currentId={currentId}
            expanded={expanded}
            setOpen={setOpen}
            canCreate={canCreate}
          />
        ))}
      </ul>
    </nav>
  );
}
