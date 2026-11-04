// Pure helpers over the flat page list (already sorted by position), shared by
// the server (breadcrumbs, sub-page lists) and the sidebar.

export type FlatPage = { id: string; title: string; parentId: string | null };

export type PageNode<T extends FlatPage = FlatPage> = T & { children: PageNode<T>[] };

export function buildTree<T extends FlatPage>(pages: T[]): PageNode<T>[] {
  const nodes = new Map(pages.map((p) => [p.id, { ...p, children: [] as PageNode<T>[] }]));
  const roots: PageNode<T>[] = [];
  for (const node of nodes.values()) {
    // A parent missing from the list shouldn't happen; show the page at the root rather than lose it.
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  return roots;
}

/** Ancestors of a page, from the root down (the page itself not included). */
export function ancestorsOf<T extends FlatPage>(pages: T[], pageId: string): T[] {
  const byId = new Map(pages.map((p) => [p.id, p]));
  const chain: T[] = [];
  const seen = new Set<string>([pageId]);
  let parentId = byId.get(pageId)?.parentId ?? null;
  while (parentId && !seen.has(parentId)) {
    const parent = byId.get(parentId);
    if (!parent) break;
    chain.unshift(parent);
    seen.add(parentId);
    parentId = parent.parentId;
  }
  return chain;
}

export function childrenOf<T extends FlatPage>(pages: T[], pageId: string): T[] {
  return pages.filter((p) => p.parentId === pageId);
}
