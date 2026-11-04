import { Check, Link2 } from "lucide-react";
import { Monogram } from "@/components/ui/Monogram";
import { StickyNote } from "@/components/ui/StickyNote";
import { Tape } from "@/components/ui/Tape";
import { ACCENT_KEYS } from "@/lib/accent";

// Small drawings of the real UI, one per feature, instead of generic icons.

export function PageSketch() {
  return (
    <div className="ruled w-full max-w-sm rounded-lg border border-border bg-surface px-5 py-4 font-serif text-base">
      <p className="font-medium">Reunión de los lunes</p>
      <p className="flex items-center gap-2">
        <span className="grid size-4 place-items-center rounded-[4px] bg-accent text-on-accent">
          <Check size={11} strokeWidth={3} aria-hidden />
        </span>
        <span className="text-ink-muted line-through">Repasar la semana</span>
      </p>
      <p className="flex items-center gap-2">
        <span className="block size-4 rounded-[4px] border-[1.5px] border-accent-ink" />
        Decidir la portada
      </p>
      <p className="mt-1 rounded bg-ink px-3 py-1 font-mono text-xs leading-6 text-[#e7d9b8]">
        npm run build
      </p>
    </div>
  );
}

export function ScreenshotSketch() {
  return (
    <figure className="light-island relative inline-block bg-photo p-2 pb-2.5 shadow-paper" style={{ rotate: "-1.2deg" }}>
      <Tape className="-top-2 left-4 w-16" rotate={-6} />
      <Tape className="-top-2 right-4 w-16" rotate={5} />
      <div className="flex h-28 w-60 gap-2 bg-[#f3f1ec] p-2">
        <span className="block w-1/3 rounded-sm bg-[#e7e3dc]" />
        <span className="flex flex-1 flex-col gap-1.5">
          <span className="block h-2.5 w-3/4 rounded-sm bg-[#ddd7cd]" />
          <span className="block h-1.5 w-full rounded-sm bg-[#e7e3dc]" />
          <span className="block h-10 w-full rounded-sm border border-dashed border-accent/60" />
        </span>
      </div>
      <figcaption className="mt-1.5 text-center font-hand text-base text-ink-muted">pegado con Ctrl+V</figcaption>
    </figure>
  );
}

export function StickySketch() {
  return (
    <StickyNote className="w-56" rotate={-2}>
      No borrar la versión antigua hasta el viernes
    </StickyNote>
  );
}

export function WorkspacesSketch() {
  const names = ["Equipo Diseño", "Proyecto Web", "Mi cuaderno"];
  return (
    <div className="flex w-full max-w-xs flex-col gap-1 rounded-lg border border-border bg-panel p-3">
      {names.map((name, i) => (
        <span
          key={name}
          className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm ${i === 0 ? "bg-surface font-medium" : ""}`}
        >
          <Monogram name={name} accent={ACCENT_KEYS[i * 2]} />
          {name}
        </span>
      ))}
    </div>
  );
}

export function InviteSketch() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <p className="font-hand text-xl leading-none">Trae a tu equipo</p>
      <span className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-on-accent">
        <Link2 size={14} strokeWidth={1.75} aria-hidden />
        Copiar enlace de invitación
      </span>
      <span className="text-xs text-ink-muted">lector · editor · admin</span>
    </div>
  );
}
