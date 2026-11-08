import { basename, dirname, resolveLink, titleFromName, withoutExtension } from "./paths";

// Which pages a Notion export holds and how they nest. Every .md is a page
// and every .csv a database; a folder named like one of them holds its
// subpages (or, for a database, its rows).

export type NotionEntry = {
  /** The file's path without extension: also the name of its subpages' folder. */
  key: string;
  kind: "page" | "database";
  file: string;
  title: string;
  parentKey: string | null;
  depth: number;
};

const IGNORED = /(^|\/)(__MACOSX|\.DS_Store)(\/|$)/;
const LINK = /\]\(([^)\s]+\.(?:md|csv))\)/gi;

export function buildTree(files: Map<string, Uint8Array>, readText: (file: string) => string): NotionEntry[] {
  const byKey = new Map<string, Omit<NotionEntry, "parentKey" | "depth">>();
  for (const file of files.keys()) {
    if (IGNORED.test(file)) continue;
    const lower = file.toLowerCase();
    const kind = lower.endsWith(".md") ? "page" : lower.endsWith(".csv") ? "database" : null;
    if (!kind) continue;
    // A database comes as "Name.csv" (current view) and "Name_all.csv" (every row): prefer the latter.
    const key = withoutExtension(file).replace(/_all$/, "");
    const existing = byKey.get(key);
    if (existing) {
      const better =
        kind === "page" ? existing.kind !== "page" : existing.kind === "database" && file.endsWith("_all.csv");
      if (!better) continue;
    }
    byKey.set(key, { key, kind, file, title: titleFromName(basename(file)) });
  }

  const parentOf = (key: string): string | null => {
    for (let dir = dirname(key); dir; dir = dirname(dir)) if (byKey.has(dir)) return dir;
    return null;
  };

  // Siblings in the order their parent links to them, as Notion shows them.
  const order = new Map<string, number>();
  for (const entry of byKey.values()) {
    if (entry.kind !== "page") continue;
    let index = 0;
    for (const match of readText(entry.file).matchAll(LINK)) {
      const target = resolveLink(entry.file, match[1]);
      if (target) order.set(withoutExtension(target).replace(/_all$/, ""), index++);
    }
  }

  const entries = [...byKey.values()].map((entry) => ({ ...entry, parentKey: parentOf(entry.key), depth: 0 }));
  const depthOf = (key: string | null): number => (key ? 1 + depthOf(parentOf(key)) : 0);
  for (const entry of entries) entry.depth = depthOf(entry.parentKey);

  return entries.sort(
    (a, b) =>
      a.depth - b.depth ||
      (order.get(a.key) ?? Infinity) - (order.get(b.key) ?? Infinity) ||
      a.title.localeCompare(b.title, "es"),
  );
}
