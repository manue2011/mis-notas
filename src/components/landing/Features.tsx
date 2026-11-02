import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { InviteSketch, PageSketch, ScreenshotSketch, StickySketch, WorkspacesSketch } from "./FeatureSketches";

type Feature = { title: string; text: string; sketch: ReactNode; note?: string };

const features: Feature[] = [
  {
    title: "Páginas para todo lo que haga falta apuntar",
    text: "Texto, títulos, listas de tareas que se tachan al marcarlas y bloques de código con colores. Escribe / y elige qué quieres insertar. Todo se guarda solo mientras escribes.",
    sketch: <PageSketch />,
  },
  {
    title: "Pantallazos pegados como fotos",
    text: "Haz una captura y pégala con Ctrl+V: se sube sola y queda en la página como una foto con cinta adhesiva, con su pie de foto escrito a mano.",
    sketch: <ScreenshotSketch />,
    note: "se convierten a WebP para que carguen rápido",
  },
  {
    title: "Notas adhesivas para lo que no puede olvidarse",
    text: "Avisos, recordatorios y dudas pendientes, pegados donde todo el equipo los ve.",
    sketch: <StickySketch />,
  },
  {
    title: "Un espacio para cada equipo",
    text: "Crea tantos espacios como necesites, cada uno con su nombre y su color. Lo que se escribe en uno no se ve desde los demás.",
    sketch: <WorkspacesSketch />,
  },
  {
    title: "Invita con un enlace y decide quién edita",
    text: "Copia un enlace y compártelo. Cada persona entra con su rol: lector solo mira, editor escribe y admin además gestiona el espacio.",
    sketch: <InviteSketch />,
  },
];

export function Features() {
  return (
    <section className="border-y border-border bg-panel/60 px-6 py-20 sm:px-12 lg:px-20">
      <h2 className="max-w-xl font-serif text-4xl leading-tight font-medium tracking-tight">
        Qué puedes hacer en Libreta
      </h2>
      <div className="mt-14 flex flex-col gap-16">
        {features.map((feature, i) => (
          <FeatureRow key={feature.title} feature={feature} flipped={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

function FeatureRow({ feature, flipped }: { feature: Feature; flipped: boolean }) {
  return (
    <article className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
      <div className={cx("max-w-md", flipped && "md:order-2")}>
        <h3 className="font-serif text-2xl leading-snug font-medium">{feature.title}</h3>
        <p className="mt-3 leading-relaxed text-ink-muted">{feature.text}</p>
        {feature.note ? <p className="mt-2 font-hand text-lg text-ink-muted">{feature.note}</p> : null}
      </div>
      <div className={cx("flex", flipped ? "md:order-1 md:justify-start" : "md:justify-end")}>
        {feature.sketch}
      </div>
    </article>
  );
}
