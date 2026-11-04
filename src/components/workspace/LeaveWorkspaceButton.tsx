"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { leaveWorkspaceAction } from "@/lib/members/actions";

/** "Salir del espacio", with a confirmation. */
export function LeaveWorkspaceButton({ organizationId, name }: { organizationId: string; name: string }) {
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
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-ink-muted hover:bg-surface/70 hover:text-ink"
      >
        <LogOut size={16} strokeWidth={1.75} aria-hidden />
        Salir de este espacio
      </button>
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
