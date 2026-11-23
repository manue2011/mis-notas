"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { emptyTrashAction } from "@/lib/pages/trash-actions";

type Props = { organizationId: string; pages: number };

/** "Vaciar papelera": deletes every page in it for good, after asking. */
export function EmptyTrashButton({ organizationId, pages }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function empty() {
    setError(null);
    startTransition(async () => {
      // On success the list refreshes and this button goes away with it.
      const result = await emptyTrashAction(organizationId);
      if (!result.ok) setError(result.error);
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:max-w-sm">
        <p className="text-sm">
          ¿Borrar para siempre {pages === 1 ? "la página" : `las ${pages} páginas`} de la papelera, con todo lo que
          tienen dentro y sus imágenes? <strong className="font-semibold">Esto no se puede deshacer.</strong>
        </p>
        <FormAlert message={error} />
        <div className="flex flex-wrap gap-2">
          <Button pending={pending} onClick={empty} className="bg-error text-on-error" autoFocus>
            {pending ? "Vaciando…" : "Sí, vaciar papelera"}
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)} className="self-start">
      <Trash2 size={16} strokeWidth={1.5} aria-hidden />
      Vaciar papelera
    </Button>
  );
}
