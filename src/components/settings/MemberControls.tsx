"use client";

import { useState, useTransition } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { changeMemberRoleAction, removeMemberAction } from "@/lib/members/actions";
import { ROLE_LABELS } from "@/lib/members/roles";

type Props = {
  organizationId: string;
  memberId: string;
  name: string;
  role: string;
  isSelf: boolean;
};

/** Role picker and "Quitar" (with a confirmation) for one member. */
export function MemberControls({ organizationId, memberId, name, role, isSelf }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeRole(next: string) {
    setError(null);
    startTransition(async () => {
      const result = await changeMemberRoleAction(organizationId, memberId, next);
      if (!result.ok) setError(result.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMemberAction(organizationId, memberId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`role-${memberId}`}>
          Rol de {name}
        </label>
        <select
          id={`role-${memberId}`}
          value={role}
          disabled={pending}
          onChange={(e) => changeRole(e.currentTarget.value)}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {!isSelf && !confirming ? (
          <Button variant="danger" disabled={pending} onClick={() => setConfirming(true)}>
            Quitar
          </Button>
        ) : null}
      </div>
      {confirming ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm sm:max-w-xs">
          <p>¿Quitar a {name} del espacio? Dejará de ver sus páginas; lo que escribió se queda.</p>
          <div className="flex gap-2">
            <Button pending={pending} onClick={remove} className="bg-error text-white" autoFocus>
              {pending ? "Quitando…" : "Quitar"}
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
      <FormAlert message={error} />
    </div>
  );
}
