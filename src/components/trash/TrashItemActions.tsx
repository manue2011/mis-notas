"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { deletePageForeverAction, restorePageAction } from "@/lib/pages/trash-actions";

type Props = { organizationId: string; pageId: string; subpages: number };

/** "Restaurar" and "Borrar para siempre", which asks first. */
export function TrashItemActions({ organizationId, pageId, subpages }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: typeof restorePageAction) {
    setError(null);
    startTransition(async () => {
      // Restoring redirects to the page; deleting refreshes the list.
      const result = await action(organizationId, pageId);
      if (!result.ok) setError(result.error);
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:max-w-xs">
        <p className="text-sm">
          ¿Borrarla para siempre
          {subpages > 0 ? `, con ${subpages === 1 ? "su subpágina" : `sus ${subpages} subpáginas`},` : ""} y sus
          imágenes? <strong className="font-semibold">Esto no se puede deshacer.</strong>
        </p>
        <FormAlert message={error} />
        <div className="flex flex-wrap gap-2">
          <Button
            pending={pending}
            onClick={() => run(deletePageForeverAction)}
            className="bg-error text-white"
            autoFocus
          >
            {pending ? "Borrando…" : "Sí, borrar para siempre"}
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <Button variant="secondary" pending={pending} onClick={() => run(restorePageAction)}>
          <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
          {pending ? "Restaurando…" : "Restaurar"}
        </Button>
        <Button variant="danger" disabled={pending} onClick={() => setConfirming(true)}>
          <Trash2 size={16} strokeWidth={1.5} aria-hidden />
          Borrar para siempre
        </Button>
      </div>
      <FormAlert message={error} />
    </div>
  );
}
