import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AccentScope } from "@/components/ui/AccentScope";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { Logo } from "@/components/ui/Logo";
import { MarginNote } from "@/components/ui/MarginNote";
import { NewWorkspaceForm } from "@/components/workspace/NewWorkspaceForm";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { requireUser } from "@/lib/auth/session";
import { listMyWorkspaces } from "@/lib/workspace/queries";

export const metadata = { title: "Nuevo espacio" };

export default function NewWorkspacePage() {
  return (
    <AccentScope accent={DEFAULT_ACCENT} className="min-h-screen">
      <main className="max-w-xl px-6 py-10 sm:px-12 lg:px-20">
        <Logo />
        <Suspense fallback={<div className="h-[28rem]" />}>
          <NewWorkspaceContent />
        </Suspense>
      </main>
    </AccentScope>
  );
}

async function NewWorkspaceContent() {
  await requireUser();
  const workspaces = await listMyWorkspaces();
  const first = workspaces.length === 0;

  return (
    <>
      {first ? null : (
        <Link
          href="/"
          className="-ml-2 mt-8 flex w-fit min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          Volver
        </Link>
      )}
      <h1 className="mt-10 inline-block font-serif text-4xl font-medium tracking-tight">
        {first ? "Tu primer cuaderno" : "Un cuaderno nuevo"}
        <HandUnderline className="mt-1" />
      </h1>
      <p className="mt-4 text-ink-muted">
        {first
          ? "Un espacio es donde tu equipo guarda sus páginas. Ponle nombre y elige su color."
          : "Ponle nombre y elige su color. Luego podrás invitar a tu equipo."}
      </p>
      {first ? (
        <MarginNote className="mt-3 block -rotate-1">se puede cambiar más tarde, sin miedo</MarginNote>
      ) : null}
      <div className="mt-10">
        <NewWorkspaceForm />
      </div>
    </>
  );
}
