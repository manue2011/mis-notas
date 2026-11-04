import { FilePlus2, FileText, Search, Trash2, type LucideIcon } from "lucide-react";
import type { SearchHit } from "@/lib/pages/search";
import { foldText, searchTerms } from "@/lib/pages/search-terms";
import { ancestorsOf, type FlatPage } from "@/lib/pages/tree";
import type { AccentKey } from "@/lib/accent";

export type PaletteAction =
  | { kind: "go"; href: string }
  | { kind: "createPage" };

export type PaletteItem = {
  id: string;
  group: "Acciones" | "Páginas" | "Espacios";
  label: string;
  /** Second line: where the page lives, or the bit of text that matched. */
  detail?: string;
  icon?: LucideIcon;
  /** Workspaces show their monogram instead of an icon. */
  workspace?: { name: string; accent: AccentKey };
  action: PaletteAction;
};

type Input = {
  query: string;
  slug: string;
  pages: FlatPage[];
  workspaces: { id: string; slug: string; name: string; accent: AccentKey }[];
  canCreate: boolean;
  remoteHits: SearchHit[];
};

const MAX_PAGES = 8;
const CREATE_WORDS = ["nueva", "pagina", "crear"];
const TRASH_WORDS = ["papelera", "borradas"];

const matchesAll = (text: string, terms: string[]) => {
  const folded = foldText(text);
  return terms.every((term) => folded.includes(term));
};

export function buildPaletteItems({ query, slug, pages, workspaces, canCreate, remoteHits }: Input): PaletteItem[] {
  const terms = searchTerms(query);
  const base = `/espacio/${slug}`;
  const pathOf = (id: string) =>
    ancestorsOf(pages, id)
      .map((p) => p.title || "Sin título")
      .join(" / ") || undefined;

  const items: PaletteItem[] = [];

  // Pages: title matches straight away, then whatever the server found in the text.
  const titleHits = terms.length ? pages.filter((p) => matchesAll(p.title, terms)) : pages;
  const seen = new Set<string>();
  for (const p of titleHits.slice(0, MAX_PAGES)) {
    seen.add(p.id);
    items.push({
      id: `page:${p.id}`,
      group: "Páginas",
      label: p.title || "Sin título",
      detail: pathOf(p.id),
      icon: FileText,
      action: { kind: "go", href: `${base}/p/${p.id}` },
    });
  }
  for (const hit of remoteHits) {
    if (seen.has(hit.id) || seen.size >= MAX_PAGES) continue;
    seen.add(hit.id);
    items.push({
      id: `page:${hit.id}`,
      group: "Páginas",
      label: hit.title || "Sin título",
      detail: hit.snippet ? `${hit.snippetCut.start ? "…" : ""}${hit.snippet}` : pathOf(hit.id),
      icon: FileText,
      action: { kind: "go", href: `${base}/p/${hit.id}` },
    });
  }

  // "nue", "crear pag"…: looks like they want a new page rather than a search.
  const wantsCreate = terms.length > 0 && terms.every((t) => CREATE_WORDS.some((w) => w.startsWith(t)));
  if (canCreate && (!terms.length || wantsCreate)) {
    items.push({ id: "create", group: "Acciones", label: "Nueva página", icon: FilePlus2, action: { kind: "createPage" } });
  }
  const wantsTrash = terms.length > 0 && terms.every((t) => TRASH_WORDS.some((w) => w.startsWith(t)));
  if (wantsTrash) {
    items.push({
      id: "trash",
      group: "Acciones",
      label: "Abrir la papelera",
      icon: Trash2,
      action: { kind: "go", href: `${base}/papelera` },
    });
  }
  if (terms.length) {
    items.push({
      id: "search",
      group: "Acciones",
      label: `Buscar «${query.trim()}» en todas las páginas`,
      icon: Search,
      action: { kind: "go", href: `${base}/buscar?q=${encodeURIComponent(query.trim())}` },
    });
  }

  for (const w of workspaces) {
    if (w.slug === slug || (terms.length && !matchesAll(w.name, terms))) continue;
    items.push({
      id: `workspace:${w.id}`,
      group: "Espacios",
      label: `Ir a ${w.name}`,
      workspace: { name: w.name, accent: w.accent },
      action: { kind: "go", href: `/espacio/${w.slug}` },
    });
  }

  // Groups in a fixed order: actions first, unless it's a plain search.
  const order =
    terms.length && !(canCreate && wantsCreate) && !wantsTrash
      ? ["Páginas", "Acciones", "Espacios"]
      : ["Acciones", "Páginas", "Espacios"];
  return items.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}
