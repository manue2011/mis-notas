import { MarginNote } from "@/components/ui/MarginNote";
import { PinnedPhoto } from "@/components/ui/PinnedPhoto";
import { StickyNote } from "@/components/ui/StickyNote";

/** A corner of a desk: a taped screenshot of a page and a sticky note. */
export function AuthDecor() {
  return (
    <aside aria-hidden className="dot-grid relative hidden overflow-hidden border-l border-border lg:block">
      <div className="absolute top-[18%] left-[12%]">
        <PinnedPhoto caption="lo que hablamos el martes">
          <FakePage />
        </PinnedPhoto>
      </div>
      <StickyNote className="absolute right-[10%] bottom-[16%] w-56" rotate={2.5}>
        Pasar a limpio las ideas del lanzamiento antes del viernes
      </StickyNote>
      <MarginNote className="absolute bottom-[9%] left-[16%] -rotate-3">
        todo el equipo en el mismo cuaderno
      </MarginNote>
    </aside>
  );
}

function FakePage() {
  return (
    <div className="flex w-72 flex-col gap-2.5 bg-paper p-5">
      <span className="block h-3.5 w-36 rounded-sm bg-ink/80" />
      <span className="block h-0.5 w-40 rounded-full bg-accent" />
      <span className="mt-2 block h-2 w-full rounded-sm bg-rule" />
      <span className="block h-2 w-11/12 rounded-sm bg-rule" />
      <span className="block h-2 w-4/5 rounded-sm bg-rule" />
      <span className="mt-2 flex items-center gap-2">
        <span className="block size-3 rounded-[3px] border-[1.5px] border-accent" />
        <span className="block h-2 w-32 rounded-sm bg-rule" />
      </span>
      <span className="flex items-center gap-2">
        <span className="block size-3 rounded-[3px] border-[1.5px] border-accent bg-accent" />
        <span className="block h-2 w-24 rounded-sm bg-rule" />
      </span>
    </div>
  );
}
