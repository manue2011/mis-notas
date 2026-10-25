"use client";

import { useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { ACCENTS, ACCENT_KEYS, type AccentKey } from "@/lib/accent";
import { AccentScope } from "@/components/ui/AccentScope";
import { Button } from "@/components/ui/Button";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { MarginNote } from "@/components/ui/MarginNote";
import { PasswordField } from "@/components/ui/PasswordField";
import { PinnedPhoto } from "@/components/ui/PinnedPhoto";
import { StickyNote } from "@/components/ui/StickyNote";
import { TextField } from "@/components/ui/TextField";

export function AccentPlayground() {
  const [accent, setAccent] = useState<AccentKey>("ink_blue");

  return (
    <AccentScope accent={accent} className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-border bg-panel p-6 md:w-72 md:border-r md:border-b-0">
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Acento</p>
        <div role="radiogroup" aria-label="Color de acento" className="flex flex-wrap gap-1">
          {ACCENT_KEYS.map((key) => (
            <button
              key={key}
              role="radio"
              aria-checked={accent === key}
              aria-label={ACCENTS[key].label}
              onClick={() => setAccent(key)}
              className="grid size-11 place-items-center rounded-full"
            >
              <span
                className="block size-6 rounded-full ring-offset-2 ring-offset-panel aria-checked:ring-2"
                aria-checked={accent === key}
                style={{ background: ACCENTS[key].hex, ["--tw-ring-color" as string]: ACCENTS[key].hex }}
              />
            </button>
          ))}
        </div>
        <nav className="flex flex-col gap-0.5 text-sm">
          <a className="rounded-md bg-accent-soft px-3 py-2.5 font-medium">Notas de la reunión</a>
          <a className="rounded-md px-3 py-2.5 hover:bg-surface">Ideas sueltas</a>
          <a className="rounded-md px-3 py-2.5 hover:bg-surface">Lanzamiento</a>
        </nav>
      </aside>

      <main className="flex-1 px-6 py-10 md:px-16">
        <div className="max-w-2xl">
          <h1 className="inline-block font-serif text-4xl font-medium tracking-tight">
            Notas de la reunión
            <HandUnderline className="mt-1" />
          </h1>

          <div className="ruled mt-8 font-serif text-lg">
            <p>Esto es el cuerpo de una nota en Newsreader, sobre renglones del papel.</p>
            <p>Cada línea cae justo en su renglón, como en un cuaderno de verdad.</p>
          </div>

          <div className="mt-10 flex flex-wrap items-start gap-10">
            <PinnedPhoto caption="el diseño de la portada">
              <div className="grid h-36 w-56 place-items-center bg-panel text-sm text-ink-muted">
                pantallazo
              </div>
            </PinnedPhoto>
            <StickyNote className="w-52">Acordarse de mandar el presupuesto el lunes.</StickyNote>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Button>
              <Plus size={16} strokeWidth={1.75} aria-hidden /> Nueva página
            </Button>
            <Button variant="secondary">
              <ListChecks size={16} strokeWidth={1.75} aria-hidden /> Secundario
            </Button>
            <Button variant="ghost">Fantasma</Button>
            <Button pending>Guardando…</Button>
            <MarginNote>← botones</MarginNote>
          </div>

          <form className="mt-12 flex max-w-sm flex-col gap-6">
            <TextField label="Correo" type="email" placeholder="tu@correo.com" />
            <PasswordField label="Contraseña" hint="Mínimo 8 caracteres." />
            <TextField label="Con error" defaultValue="hola@" error="Este correo no parece válido." />
          </form>

          <div className="dot-grid mt-12 h-40 rounded-lg border border-border" />
        </div>
      </main>
    </AccentScope>
  );
}
