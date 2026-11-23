"use client";

import { useState, useTransition } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { leaveWorkspaceAction } from "@/lib/members/actions";
import { DeleteWorkspaceForm } from "./DeleteWorkspaceForm";

type Props = {
  organizationId: string;
  name: string;
  /** Nobody else is in it and you're its admin: leaving means deleting it. */
  canDelete: boolean;
};

/** "Salir del espacio", with a confirmation; "Eliminar el espacio" when you're alone in it. */
export function LeaveWorkspaceButton({ organizationId, name, canDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function leave() {
    setError(null);
    startTransition(async () => {
      // Redirects to /libretas on success.
      const result = await leaveWorkspaceAction(organizationId);
      if (result && !result.ok) setError(result.error);
    });
  }

  if (!confirming) {
    const Icon = canDelete ? Trash2 : LogOut;
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-ink-muted hover:bg-surface/70 hover:text-ink"
      >
        <Icon size={16} strokeWidth={1.75} aria-hidden />
        {canDelete ? "Eliminar este espacio" : "Salir de este espacio"}
      </button>
    );
  }

  if (canDelete) {
    return (
      <div className="flex flex-col gap-2">
        <p className="px-2 text-sm text-ink-muted">Eres la única persona aquí, así que puedes eliminarlo entero.</p>
        <DeleteWorkspaceForm
          organizationId={organizationId}
          name={name}
          startOpen
          onCancel={() => setConfirming(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
      <p>¿Salir de «{name}»? Para volver necesitarás otra invitación.</p>
      <FormAlert message={error} />
      <div className="flex gap-2">
        <Button pending={pending} onClick={leave} className="bg-error text-on-error" autoFocus>
          {pending ? "Saliendo…" : "Salir"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
