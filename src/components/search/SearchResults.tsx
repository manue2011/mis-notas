import Link from "next/link";
import { FileText } from "lucide-react";
import { MarginNote } from "@/components/ui/MarginNote";
import type { SearchHit } from "@/lib/pages/search";
import { Highlighted } from "./Highlighted";

type Props = {
  slug: string;
  hits: (SearchHit & { path: string[] })[];
  terms: string[];
  query: string;
};

export function SearchResults({ slug, hits, terms, query }: Props) {
  if (hits.length === 0) {
    return (
      <div className="ruled mt-10 max-w-xl font-serif text-lg">
        <p>Ni rastro de «{query}» en este cuaderno.</p>
        <p>Prueba con otra palabra, o con menos: buscamos páginas que las tengan todas.</p>
        <MarginNote className="mt-4 block -rotate-1">a veces está en la página de al lado…</MarginNote>
      </div>
    );
  }

  return (
    <>
      <p className="mt-8 text-sm text-ink-muted" role="status">
        {hits.length === 1 ? "1 página" : `${hits.length} páginas`}
      </p>
      <ul className="mt-3 flex flex-col gap-1">
        {hits.map((hit) => (
          <li key={hit.id}>
            <Link
              href={`/espacio/${slug}/p/${hit.id}`}
              className="flex gap-3 rounded-lg px-3 py-3 hover:bg-panel"
            >
              <FileText size={18} strokeWidth={1.5} className="mt-1 shrink-0 text-ink-muted" aria-hidden />
              <span className="flex min-w-0 flex-col gap-1">
                {hit.path.length > 0 ? (
                  <span className="truncate text-xs text-ink-muted">{hit.path.join(" / ")}</span>
                ) : null}
                <span className={hit.title ? "font-serif text-lg" : "font-serif text-lg text-ink-muted italic"}>
                  {hit.title ? <Highlighted text={hit.title} terms={terms} /> : "Sin título"}
                </span>
                {hit.snippet ? (
                  <span className="line-clamp-2 font-serif text-base text-ink-muted">
                    {hit.snippetCut.start ? "…" : null}
                    <Highlighted text={hit.snippet} terms={terms} />
                    {hit.snippetCut.end ? "…" : null}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
