import Link from "next/link";
import { Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { MarginNote } from "@/components/ui/MarginNote";

/** Shown instead of a page that's in the trash. */
export function TrashedPageNotice({ slug, title }: { slug: string; title: string }) {
  return (
    <div className="w-full max-w-3xl px-6 py-16 md:px-16">
      <p className="font-serif text-2xl">
        «{title || "Sin título"}» está en la papelera.
      </p>
      <p className="mt-3 max-w-xl text-ink-muted">
        Alguien la borró. Desde la papelera se puede restaurar, con todo lo que tenía dentro.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-6">
        <Link href={`/espacio/${slug}/papelera`} className={buttonClasses("secondary")}>
          <Trash2 size={16} strokeWidth={1.5} aria-hidden />
          Ir a la papelera
        </Link>
        <MarginNote className="-rotate-1">no se ha perdido nada</MarginNote>
      </div>
    </div>
  );
}
