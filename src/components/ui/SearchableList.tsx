"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";

export type SearchableRow = {
  key: string;
  /** What the search box matches against (name, email…). */
  search: string;
  node: ReactNode;
};

type Props = {
  rows: SearchableRow[];
  /** "personas": in "Ver las otras 4 personas" and the search label. */
  noun: { one: string; many: string };
  /** At most this many before "Ver los otros…". */
  shown?: number;
  /** The search box appears from this many rows on. */
  searchFrom?: number;
};

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * A long list kept short: the first rows, the rest behind a button, and a
 * search box (name, email…) once there are enough to need it.
 */
export function SearchableList({ rows, noun, shown = 10, searchFrom = 8 }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);

  const terms = fold(query).split(/\s+/).filter(Boolean);
  const matches = terms.length ? rows.filter((r) => terms.every((t) => fold(r.search).includes(t))) : rows;
  const visible = terms.length || all ? matches : matches.slice(0, shown);
  const hidden = matches.length - visible.length;

  return (
    <div className="flex flex-col gap-3">
      {rows.length >= searchFrom ? (
        <div className="flex max-w-sm items-center gap-2 border-b border-field-line focus-within:border-accent-ink">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
          <label htmlFor={id} className="sr-only">
            Buscar {noun.many} por nombre o correo
          </label>
          <input
            id={id}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Buscar por nombre o correo"
            className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
          />
        </div>
      ) : null}
      {visible.length ? (
        <ul className="flex flex-col divide-y divide-dashed divide-border border-y border-dashed border-border">
          {visible.map((row) => (
            <li key={row.key}>{row.node}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">Nadie coincide con «{query.trim()}».</p>
      )}
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="flex min-h-11 items-center gap-1.5 self-start text-sm text-ink-muted hover:text-ink"
        >
          <ChevronDown size={16} strokeWidth={1.5} aria-hidden />
          Ver {hidden === 1 ? `la otra ${noun.one}` : `las otras ${hidden} ${noun.many}`}
        </button>
      ) : null}
    </div>
  );
}

/** One person: a compact line that unfolds to its controls. */
export function PersonRow({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-md px-1 py-2 hover:bg-panel/60 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-3">{summary}</div>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden
          className="shrink-0 text-ink-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="flex flex-col gap-3 pt-1 pb-4 pl-1 sm:pl-12">{children}</div>
    </details>
  );
}
