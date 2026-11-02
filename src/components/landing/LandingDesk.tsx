import { Check } from "lucide-react";
import { MarginNote } from "@/components/ui/MarginNote";
import { PinnedPhoto } from "@/components/ui/PinnedPhoto";
import { StickyNote } from "@/components/ui/StickyNote";

/** The decorative desk: a page taped down, a sticky note and a margin scribble. */
export function LandingDesk() {
  return (
    <div aria-hidden className="dot-grid relative hidden h-[30rem] rounded-2xl border border-border lg:block">
      {/* Positioned wrappers: the pieces set their own `relative`. */}
      <div className="absolute top-14 left-[12%]">
        <PinnedPhoto caption="el proceso de exportar, por fin en un sitio">
          <MiniPage />
        </PinnedPhoto>
      </div>
      <div className="absolute right-[8%] bottom-16">
        <StickyNote className="w-60" rotate={2.5}>
          Reunión del lunes: traer los pantallazos del cliente
        </StickyNote>
      </div>
      <div className="absolute bottom-8 left-[14%]">
        <MarginNote className="block -rotate-3">↑ todo el equipo lo ve</MarginNote>
      </div>
    </div>
  );
}

function MiniPage() {
  return (
    <div className="flex w-72 flex-col gap-2.5 bg-paper p-5">
      <span className="font-serif text-lg leading-none font-medium text-ink">Exportar desde Figma</span>
      <span className="block h-0.5 w-32 rounded-full bg-accent" />
      <span className="mt-1 block h-2 w-full rounded-sm bg-rule" />
      <span className="block h-2 w-10/12 rounded-sm bg-rule" />
      <Task done>Ocultar las capas de guía</Task>
      <Task done>Exportar a 2x en WebP</Task>
      <Task>Pegar el pantallazo aquí</Task>
    </div>
  );
}

function Task({ done, children }: { done?: boolean; children: string }) {
  return (
    <span className="flex items-center gap-2 text-xs text-ink">
      <span
        className={
          done
            ? "grid size-3.5 place-items-center rounded-[3px] bg-accent text-on-accent"
            : "block size-3.5 rounded-[3px] border-[1.5px] border-accent"
        }
      >
        {done ? <Check size={10} strokeWidth={3} /> : null}
      </span>
      <span className={done ? "text-ink-muted line-through" : undefined}>{children}</span>
    </span>
  );
}
