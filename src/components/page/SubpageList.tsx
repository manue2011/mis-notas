import Link from "next/link";
import { FileText } from "lucide-react";
import { MarginNote } from "@/components/ui/MarginNote";
import { NewPageButton } from "@/components/workspace/NewPageButton";

type Props = {
  slug: string;
  organizationId: string;
  pageId: string;
  subpages: { id: string; title: string }[];
  canCreate: boolean;
};

/** Index of the pages inside this one, at the foot of the page. */
export function SubpageList({ slug, organizationId, pageId, subpages, canCreate }: Props) {
  if (subpages.length === 0 && !canCreate) return null;

  return (
    <section aria-labelledby="subpages-title" className="mx-auto w-full max-w-3xl px-6 pb-16 md:px-16">
      <div className="border-t border-dashed border-border pt-6">
        <h2 id="subpages-title" className="text-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
          Dentro de esta página
        </h2>
        {subpages.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-0.5">
            {subpages.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/espacio/${slug}/p/${p.id}`}
                  className="flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 font-serif text-lg hover:bg-panel"
                >
                  <FileText size={16} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
                  <span className={p.title ? "truncate" : "truncate text-ink-muted italic"}>
                    {p.title || "Sin título"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <MarginNote className="mt-2 block">nada guardado dentro… de momento</MarginNote>
        )}
        {canCreate ? (
          <div className="mt-2">
            <NewPageButton organizationId={organizationId} parentId={pageId} label="Añadir subpágina" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
