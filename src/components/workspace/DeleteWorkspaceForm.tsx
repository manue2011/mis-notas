"use client";

import { useState, useTransition, type FormEvent } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { deleteWorkspaceAction } from "@/lib/workspace/actions";

type Props = {
  organizationId: string;
  name: string;
  /** Shows the form straight away (the caller has its own button). */
  startOpen?: boolean;
  onCancel?: () => void;
};

/** "Eliminar el espacio": asks for its name typed out before doing anything. */
export function DeleteWorkspaceForm({ organizationId, name, startOpen = false, onCancel }: Props) {
  const [open, setOpen] = useState(startOpen);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = typed.trim().toLowerCase() === name.trim().toLowerCase();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      // Redirects to another workspace on success.
      const result = await deleteWorkspaceAction(organizationId, typed);
      if (result && !result.ok) setError(result.error);
    });
  }

  function cancel() {
    setOpen(false);
    setTyped("");
    setError(null);
    onCancel?.();
  }

  if (!open) {
    return (
      <Button variant="danger" className="-ml-4" onClick={() => setOpen(true)}>
        Eliminar el espacio…
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border border-error/40 bg-surface p-4">
      <p className="text-sm">
        Se borrarán todas sus páginas, la papelera y las imágenes.{" "}
        <strong className="font-semibold">Esto no se puede deshacer.</strong> Para confirmar, escribe su nombre:{" "}
        <strong className="break-words">{name}</strong>
      </p>
      <TextField
        label="Nombre del espacio"
        autoComplete="off"
        value={typed}
        onChange={(e) => setTyped(e.currentTarget.value)}
        autoFocus
      />
      <FormAlert message={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" pending={pending} disabled={!matches} className="bg-error text-on-error">
          {pending ? "Eliminando…" : "Eliminar para siempre"}
        </Button>
        <Button type="button" variant="ghost" onClick={cancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
