"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AccentScope } from "@/components/ui/AccentScope";
import { Button, buttonClasses } from "@/components/ui/Button";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { MarginNote } from "@/components/ui/MarginNote";
import { DEFAULT_ACCENT } from "@/lib/accent";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AccentScope accent={DEFAULT_ACCENT} className="min-h-screen">
      <main className="flex min-h-screen flex-col justify-center px-6 py-10 sm:px-12 lg:px-20">
        <div className="max-w-md">
          <h1 className="inline-block font-serif text-5xl font-medium tracking-tight">
            Se ha corrido la tinta
            <HandUnderline className="mt-1" />
          </h1>
          <p className="mt-6 font-serif text-xl leading-snug text-ink-muted">
            Algo ha fallado al abrir esta página. Lo que ya estaba guardado sigue a salvo.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button onClick={reset}>Volver a intentarlo</Button>
            <Link href="/" className={buttonClasses("secondary")}>
              Ir al inicio
            </Link>
          </div>
          {error.digest ? (
            <MarginNote className="mt-6 block">referencia del error: {error.digest}</MarginNote>
          ) : null}
        </div>
      </main>
    </AccentScope>
  );
}
