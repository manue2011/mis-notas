import { Suspense } from "react";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { MarginNote } from "@/components/ui/MarginNote";
import { HeroActions } from "./HeroActions";
import { LandingDesk } from "./LandingDesk";

export function Hero() {
  return (
    <section className="grid items-center gap-12 px-6 pt-10 pb-20 sm:px-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:px-20 lg:pt-16">
      <div className="max-w-xl">
        <MarginNote className="block -rotate-2">para equipos pequeños</MarginNote>
        <h1 className="mt-3 font-serif text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl">
          Las notas de tu equipo, en un solo{" "}
          <span className="inline-block">
            cuaderno
            <HandUnderline className="-mt-1" />
          </span>
        </h1>
        <p className="mt-6 font-serif text-xl leading-relaxed text-ink-muted">
          Libreta es un cuaderno compartido para apuntar procesos, reuniones e ideas: texto, listas
          de tareas, pantallazos pegados con Ctrl+V, notas adhesivas y código. Cada equipo tiene su
          espacio, y todos escriben en las mismas páginas.
        </p>
        <Suspense fallback={<div className="mt-10 h-11" />}>
          <HeroActions />
        </Suspense>
      </div>
      <LandingDesk />
    </section>
  );
}
