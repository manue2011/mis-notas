"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { FlatPage } from "@/lib/pages/tree";
import { PagePreviewCard } from "./PagePreviewCard";
import { previewStore } from "./preview-store";

type Props = { organizationId: string; pages: FlatPage[] };

/** Shows the hovered page link's preview. Lives beside the editor, not in it. */
export function PagePreviewLayer({ organizationId, pages }: Props) {
  const target = useSyncExternalStore(previewStore.subscribe, previewStore.get, () => null);

  useEffect(() => {
    if (!target) return;
    const hide = () => previewStore.hide();
    window.addEventListener("scroll", hide, { capture: true, once: true });
    return () => window.removeEventListener("scroll", hide, { capture: true });
  }, [target]);
  // Leaving the page with a preview open shouldn't leave it behind.
  useEffect(() => () => previewStore.hide(), []);

  if (!target) return null;
  return (
    <PagePreviewCard
      key={target.pageId}
      organizationId={organizationId}
      pageId={target.pageId}
      pages={pages}
      at={{ top: target.top, left: target.left }}
    />
  );
}
