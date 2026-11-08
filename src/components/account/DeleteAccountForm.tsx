"use client";

import { useState, useTransition, type FormEvent } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { deleteAccountAction } from "@/lib/account/actions";

/** "Eliminar mi cuenta": asks for the email typed out before doing anything. */
export function DeleteAccountForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      // Redirects home on success.
      const result = await deleteAccountAction(typed);
      if (result && !result.ok) setError(result.error);
    });
  }

  if (!open) {
    return (
      <Button variant="danger" className="-ml-4" onClick={() => setOpen(true)}>
        Eliminar mi cuenta…
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-lg border border-error/40 bg-surface p-5">
      <p className="text-sm">
        Esto no se puede deshacer. Para confirmar, escribe tu correo: <strong className="break-all">{email}</strong>
      </p>
      <TextField
        label="Tu correo"
        type="email"
        autoComplete="off"
        value={typed}
        onChange={(e) => setTyped(e.currentTarget.value)}
        autoFocus
      />
      <FormAlert message={error} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          pending={pending}
          disabled={!matches}
          className="bg-error text-on-error"
        >
          {pending ? "Eliminando…" : "Eliminar para siempre"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
