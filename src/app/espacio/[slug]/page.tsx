import { Suspense } from "react";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { MarginNote } from "@/components/ui/MarginNote";
import { StickyNote } from "@/components/ui/StickyNote";
import { requireWorkspaceBySlug } from "@/lib/workspace/access";

export default function WorkspacePage({ params }: PageProps<"/espacio/[slug]">) {
  return (
    <Suspense fallback={null}>
      <EmptyWorkspace params={params} />
    </Suspense>
  );
}

// Placeholder until pages exist (step 7).
async function EmptyWorkspace({ params }: { params: PageProps<"/espacio/[slug]">["params"] }) {
  const { slug } = await params;
  const access = await requireWorkspaceBySlug(slug);

  return (
    <div className="max-w-3xl px-6 py-12 md:px-16 md:py-16">
      <h1 className="inline-block font-serif text-4xl font-medium tracking-tight md:text-5xl">
        {access.name}
        <HandUnderline className="mt-1" />
      </h1>
      <div className="ruled mt-10 max-w-xl font-serif text-lg">
        <p>Este cuaderno está recién estrenado: ni una mancha de tinta todavía.</p>
        <p>Muy pronto podrás llenarlo de páginas, listas y pantallazos.</p>
      </div>
      <div className="mt-14 flex flex-wrap items-start gap-10">
        <StickyNote className="w-60" rotate={-2}>
          Primera tarea: escribir algo que merezca la pena guardar.
        </StickyNote>
        <MarginNote className="mt-6 rotate-2">← las páginas llegan en el siguiente paso</MarginNote>
      </div>
    </div>
  );
}
