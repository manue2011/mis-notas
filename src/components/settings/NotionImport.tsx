"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileArchive } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import type { NotionProgress, NotionResult } from "@/lib/notion/run";

type State =
  | { step: "idle" }
  | { step: "running"; fileName: string; progress: NotionProgress }
  | { step: "done"; result: NotionResult }
  | { step: "error"; error: string };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function describe(progress: NotionProgress): { text: string; fraction: number | null } {
  if (progress.phase === "unzipping") return { text: "Abriendo el zip…", fraction: null };
  if (progress.phase === "creating") return { text: `Creando ${plural(progress.total, "página", "páginas")}…`, fraction: null };
  return {
    text: `Pasando el contenido: ${progress.done} de ${progress.total} (${plural(progress.images, "imagen", "imágenes")})`,
    fraction: progress.total ? progress.done / progress.total : null,
  };
}

/** "Importar de Notion": a zip exported as Markdown & CSV becomes pages of this workspace. */
export function NotionImport({ organizationId, slug }: { organizationId: string; slug: string }) {
  const [state, setState] = useState<State>({ step: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const running = state.step === "running";

  // Leaving halfway would leave pages created but empty.
  useEffect(() => {
    if (!running) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  async function start(file: File) {
    setState({ step: "running", fileName: file.name, progress: { phase: "unzipping" } });
    try {
      // Loaded on demand: the zip reader and Markdown parser are only needed here.
      const { runNotionImport, NotionImportError } = await import("@/lib/notion/run");
      try {
        const result = await runNotionImport(file, organizationId, (progress) =>
          setState({ step: "running", fileName: file.name, progress }),
        );
        setState({ step: "done", result });
        router.refresh();
      } catch (error) {
        console.error("[notion]", error);
        setState({
          step: "error",
          error: error instanceof NotionImportError ? error.message : "La importación se ha cortado. Vuelve a intentarlo.",
        });
        router.refresh();
      }
    } catch {
      setState({ step: "error", error: "No se ha podido cargar el importador. Recarga la página." });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
        <li>
          En Notion, abre <strong className="font-medium">Ajustes → Exportar</strong> (o el menú ⋯ de una página →{" "}
          <strong className="font-medium">Exportar</strong>).
        </li>
        <li>
          Elige <strong className="font-medium">Markdown y CSV</strong>, con subpáginas e imágenes.
        </li>
        <li>Sube aquí el .zip tal cual, sin descomprimirlo.</li>
      </ol>
      <p className="text-sm text-ink-muted">
        Se respetan las subpáginas, los enlaces entre páginas, las listas de tareas, el código y las imágenes; los
        destacados pasan a notas adhesivas y las bases de datos, a una lista de sus filas. Las vistas de tablero o
        calendario no se pueden traer.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (file) start(file);
        }}
      />

      {state.step === "running" ? (
        <RunningCard fileName={state.fileName} progress={state.progress} />
      ) : (
        <Button variant="secondary" className="self-start" onClick={() => inputRef.current?.click()}>
          <FileArchive size={16} strokeWidth={1.75} aria-hidden />
          {state.step === "idle" ? "Elegir el zip de Notion" : "Importar otro zip"}
        </Button>
      )}

      {state.step === "error" ? <FormAlert message={state.error} /> : null}
      {state.step === "done" ? <Summary result={state.result} slug={slug} /> : null}
    </div>
  );
}

function RunningCard({ fileName, progress }: { fileName: string; progress: NotionProgress }) {
  const { text, fraction } = describe(progress);
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <p className="truncate text-sm font-medium">{fileName}</p>
      <p className="text-sm text-ink-muted">{text}</p>
      <div className="h-1 overflow-hidden rounded-full bg-border">
        <div
          className={fraction === null ? "h-full w-1/3 animate-pulse bg-accent" : "h-full bg-accent transition-[width] duration-200"}
          style={fraction === null ? undefined : { width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
      <p className="font-hand text-base text-ink-muted">no cierres esta pestaña hasta que termine</p>
    </div>
  );
}

function Summary({ result, slug }: { result: NotionResult; slug: string }) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
      <p>
        Listo: {plural(result.pages, "página importada", "páginas importadas")} y{" "}
        {plural(result.images, "imagen", "imágenes")}.
        {result.firstPageId ? (
          <>
            {" "}
            <Link href={`/espacio/${slug}/p/${result.firstPageId}`} className="font-medium underline underline-offset-4">
              Abrir la primera
            </Link>
          </>
        ) : null}
      </p>
      {result.warnings.length ? (
        <details>
          <summary className="cursor-pointer text-ink-muted">
            {plural(result.warnings.length, "aviso", "avisos")}: cosas que no se han podido traer
          </summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-ink-muted">
            {result.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
