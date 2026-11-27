import type { FlatPage } from "./tree";

/** "Todo el cuaderno", «Nóminas» or "3 páginas", for buttons and lists. */
export function scopeSummary(pages: FlatPage[], value: string[] | null): string {
  if (value === null) return "Todo el cuaderno";
  const titles = value
    .map((id) => pages.find((p) => p.id === id))
    .filter((p): p is FlatPage => p !== undefined)
    .map((p) => p.title || "Sin título");
  if (titles.length === 0) return "Ninguna página";
  if (titles.length === 1) return `«${titles[0]}»`;
  return `${titles.length} páginas`;
}
