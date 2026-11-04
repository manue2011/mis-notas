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

/** Ids of every page below this one. */
export function descendantIds(pages: FlatPage[], pageId: string): Set<string> {
  const found = new Set<string>();
  const queue = [pageId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const p of pages) {
      if (p.parentId === id && !found.has(p.id)) {
        found.add(p.id);
        queue.push(p.id);
      }
    }
  }
  return found;
}

/** Where a page goes: under `parentId`, right before `beforeId` (or last). */
export type PageMove = { pageId: string; parentId: string | null; beforeId: string | null };

/** The list as it will look after the move (used for optimistic updates). */
export function applyMove<T extends FlatPage>(pages: T[], move: PageMove): T[] {
  const moved = pages.find((p) => p.id === move.pageId);
  if (!moved) return pages;
  const rest = pages.filter((p) => p.id !== move.pageId);
  const index = move.beforeId ? rest.findIndex((p) => p.id === move.beforeId) : -1;
  const next = { ...moved, parentId: move.parentId };
  return index < 0 ? [...rest, next] : [...rest.slice(0, index), next, ...rest.slice(index)];
}

/** Whether a page may be moved under `parentId` (not into itself or its own branch). */
export function canMoveUnder(pages: FlatPage[], pageId: string, parentId: string | null): boolean {
  return parentId === null || (parentId !== pageId && !descendantIds(pages, pageId).has(parentId));
}

/** Moves for the "up" / "down" menu entries, or null at either end of the siblings. */
export function siblingMoves(pages: FlatPage[], pageId: string) {
  const page = pages.find((p) => p.id === pageId);
  if (!page) return { up: null, down: null };
  const siblings = pages.filter((p) => p.parentId === page.parentId);
  const i = siblings.findIndex((p) => p.id === pageId);
  const move = (beforeId: string | null): PageMove => ({ pageId, parentId: page.parentId, beforeId });
  return {
    up: i > 0 ? move(siblings[i - 1].id) : null,
    down: i < siblings.length - 1 ? move(siblings[i + 2]?.id ?? null) : null,
  };
}

/** Pages this one could be moved inside, in tree order with their depth. */
export function moveTargets(pages: FlatPage[], pageId: string) {
  const excluded = descendantIds(pages, pageId).add(pageId);
  const targets: { id: string; label: string; depth: number }[] = [];
  const walk = (nodes: PageNode[], depth: number) => {
    for (const node of nodes) {
      if (excluded.has(node.id)) continue;
      targets.push({ id: node.id, label: node.title || "Sin título", depth });
      walk(node.children, depth + 1);
    }
  };
  walk(buildTree(pages), 0);
  return targets;
}
