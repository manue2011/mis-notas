import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { MarginNote } from "@/components/ui/MarginNote";
import { StickyNote } from "@/components/ui/StickyNote";
import { NewPageButton } from "@/components/workspace/NewPageButton";
import { TopBar } from "@/components/workspace/TopBar";
import { getLastEditedPageId } from "@/lib/pages/queries";
import { listTrash } from "@/lib/pages/trash";
import { can, requireWorkspaceBySlug } from "@/lib/workspace/access";

export default function WorkspacePage({ params }: PageProps<"/espacio/[slug]">) {
  return (
    <Suspense fallback={null}>
      <WorkspaceHome params={params} />
    </Suspense>
  );
}

// Opens the last edited page; with no pages, invites you to write the first
// (or points at the trash, if that's where they all went).
async function WorkspaceHome({ params }: { params: PageProps<"/espacio/[slug]">["params"] }) {
  const { slug } = await params;
  const access = await requireWorkspaceBySlug(slug);
  const lastPageId = await getLastEditedPageId(slug);
  if (lastPageId) redirect(`/espacio/${slug}/p/${lastPageId}`);

  const canCreate = can(access.role, { page: ["create"] });
  const trashed = (await listTrash(slug)).length;

  return (
    <>
      <TopBar crumbs={[{ label: access.name }]} />
      <div className="max-w-3xl px-6 py-12 md:px-16 md:py-16">
        <h1 className="inline-block font-serif text-4xl font-medium tracking-tight md:text-5xl">
          {access.name}
          <HandUnderline className="mt-1" />
        </h1>
        <div className="ruled mt-10 max-w-xl font-serif text-lg">
          {trashed > 0 ? (
            <p>
              No queda ninguna página a la vista: todo está en la{" "}
              <Link href={`/espacio/${access.slug}/papelera`} className="text-accent-ink underline underline-offset-4">
                papelera
              </Link>
              , por si hay algo que rescatar.
            </p>
          ) : (
            <p>Este cuaderno está recién estrenado: ni una mancha de tinta todavía.</p>
          )}
          <p>
            {canCreate
              ? "Empieza por una página: unas notas, una lista, lo que tengas en la cabeza."
              : "Cuando tus compañeros escriban la primera página, aparecerá aquí."}
          </p>
        </div>
        <div className="mt-12 flex flex-wrap items-start gap-10">
          {canCreate ? (
            <div className="flex flex-col items-start gap-3">
              <NewPageButton
                organizationId={access.organizationId}
                variant="primary"
                label="Escribir la primera página"
              />
              <MarginNote className="-rotate-1">↑ el resto, después</MarginNote>
            </div>
          ) : null}
          <StickyNote className="w-60" rotate={-2}>
            Las mejores notas empiezan torcidas. Ya se pasarán a limpio.
          </StickyNote>
        </div>
      </div>
    </>
  );
}
