import Link from "next/link";
import { AccentScope } from "@/components/ui/AccentScope";
import { buttonClasses } from "@/components/ui/Button";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { Logo } from "@/components/ui/Logo";
import { StickyNote } from "@/components/ui/StickyNote";
import { DEFAULT_ACCENT } from "@/lib/accent";

export const metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <AccentScope accent={DEFAULT_ACCENT} className="min-h-screen">
      <main className="flex min-h-screen flex-col px-6 py-10 sm:px-12 lg:px-20">
        <Logo />
        <div className="my-auto flex flex-wrap items-center gap-x-16 gap-y-10 py-12">
          <div className="max-w-md">
            <h1 className="inline-block font-serif text-5xl font-medium tracking-tight">
              Esta hoja no está
              <HandUnderline className="mt-1" />
            </h1>
            <p className="mt-6 font-serif text-xl leading-snug text-ink-muted">
              Puede que la hayan arrancado del cuaderno, que el enlace esté mal copiado o que no
              tengas acceso a ese espacio.
            </p>
            <Link href="/" className={buttonClasses("primary", "mt-8")}>
              Volver a mis libretas
            </Link>
          </div>
          <StickyNote className="w-64" rotate={3}>
            Error 404: buscada por todas partes, incluso debajo del sofá.
          </StickyNote>
        </div>
      </main>
    </AccentScope>
  );
}
