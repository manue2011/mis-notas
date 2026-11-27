"use client";

import { useState, useTransition } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { revokeAllInviteLinksAction } from "@/lib/invites/actions";

/** "Anular todos", with a confirmation: links already sent stop working too. */
export function RevokeAllLinksButton({ organizationId, count }: { organizationId: string; count: number }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function revokeAll() {
    setError(null);
    startTransition(async () => {
      const result = await revokeAllInviteLinksAction(organizationId);
      if (result.ok) setConfirming(false);
      else setError(result.error);
    });
  }

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)} className="self-start">
        Anular todos
      </Button>
    );
  }
  return (
    <div className="flex max-w-md flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
      <p>
        ¿Anular los {count} enlaces activos? Quien tenga uno sin usar ya no podrá entrar con él; quien ya entró
        sigue dentro.
      </p>
      <FormAlert message={error} />
      <div className="flex gap-2">
        <Button pending={pending} onClick={revokeAll} className="bg-error text-on-error" autoFocus>
          {pending ? "Anulando…" : "Anular todos"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
