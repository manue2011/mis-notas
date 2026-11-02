import { PinnedPhoto } from "@/components/ui/PinnedPhoto";
import { StickyNote } from "@/components/ui/StickyNote";

/** A corner of a desk: a taped screenshot of a page and a sticky note. */
export function AuthDecor() {
  return (
    <aside
      aria-hidden
      className="dot-grid hidden flex-col items-center justify-center gap-6 border-l border-border lg:flex"
    >
      <PinnedPhoto caption="la guía de exportación, por fin en un sitio" className="ml-16 rotate-[1.5deg]">
        <FakeScreenshot />
      </PinnedPhoto>
      <StickyNote className="ml-40 w-72" rotate={-1.5}>
        Notas, pantallazos y explicaciones de todo el equipo, en un solo cuaderno.
      </StickyNote>
    </aside>
  );
}

function FakeScreenshot() {
  return (
    <div className="flex h-44 w-80 gap-3 bg-[#f3f1ec] p-3">
      <span className="block w-1/3 rounded-sm bg-[#e7e3dc]" />
      <span className="flex flex-1 flex-col gap-2 pt-1">
        <span className="block h-3 w-3/4 rounded-sm bg-[#ddd7cd]" />
        <span className="block h-2 w-full rounded-sm bg-[#e7e3dc]" />
        <span className="block h-2 w-5/6 rounded-sm bg-[#e7e3dc]" />
        <span className="block h-2 w-4/6 rounded-sm bg-[#e7e3dc]" />
      </span>
    </div>
  );
}
