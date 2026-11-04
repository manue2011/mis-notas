import { Suspense } from "react";
import { FileText } from "lucide-react";
import { TrashItemActions } from "@/components/trash/TrashItemActions";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { MarginNote } from "@/components/ui/MarginNote";
import { TopBar } from "@/components/workspace/TopBar";
import { formatDate } from "@/lib/format";
import { listTrash } from "@/lib/pages/trash";
import { can, requireWorkspaceBySlug } from "@/lib/workspace/access";

type Props = PageProps<"/espacio/[slug]/papelera">;

export default function TrashPage(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-16 border-b border-dashed border-border" />}>
      <TrashScreen {...props} />
    </Suspense>
  );
}

async function TrashScreen({ params }: Props) {
  const { slug } = await params;
  const access = await requireWorkspaceBySlug(slug, { page: ["read"] });
  const entries = await listTrash(slug);
  const canManage = can(access.role, { page: ["delete"] });

  return (
    <>
      <TopBar crumbs={[{ label: access.name, href: `/espacio/${access.slug}` }, { label: "Papelera" }]} />
      <div className="w-full max-w-3xl px-6 py-12 md:px-16">
        <h1 className="inline-block font-serif text-4xl font-medium tracking-tight">
          Papelera
          <HandUnderline className="mt-1" />
        </h1>
        <p className="mt-6 max-w-xl text-ink-muted">
          Las páginas borradas esperan aquí, con todo lo que tenían dentro. Nada se borra solo: solo desaparecen
          si alguien las borra para siempre.
        </p>

        {entries.length === 0 ? (
          <div className="ruled mt-10 max-w-xl font-serif text-lg">
            <p>La papelera está vacía. Ni un papel arrugado.</p>
            <MarginNote className="mt-4 block -rotate-1">qué orden, da hasta gusto</MarginNote>
          </div>
        ) : (
          <ul className="mt-10 flex flex-col divide-y divide-dashed divide-border border-y border-dashed border-border">
            {entries.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <FileText size={18} strokeWidth={1.5} className="mt-1.5 shrink-0 text-ink-muted" aria-hidden />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className={entry.title ? "font-serif text-lg" : "font-serif text-lg text-ink-muted italic"}>
                      {entry.title || "Sin título"}
                    </span>
                    <span className="text-sm text-ink-muted">
                      Borrada el {formatDate(entry.deletedAt)}
                      {entry.deletedBy ? ` por ${entry.deletedBy}` : ""}
                      {entry.subpages > 0
                        ? ` · ${entry.subpages === 1 ? "con 1 subpágina" : `con ${entry.subpages} subpáginas`}`
                        : ""}
                    </span>
                  </div>
                </div>
                {canManage ? (
                  <TrashItemActions
                    organizationId={access.organizationId}
                    pageId={entry.id}
                    subpages={entry.subpages}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
