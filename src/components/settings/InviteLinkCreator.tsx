"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Link2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { MarginNote } from "@/components/ui/MarginNote";
import type { RoleName } from "@/lib/auth/permissions";
import { createInviteLinkAction } from "@/lib/invites/actions";
import { INVITE_LINK_DAY_OPTIONS } from "@/lib/invites/rules";
import { ROLE_LABELS } from "@/lib/members/roles";

const USE_OPTIONS = [null, 1, 5, 10, 25] as const;

const selectClass = "min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink";

/** Pick role, expiry and uses; the new link is shown once, to copy. */
export function InviteLinkCreator({ organizationId }: { organizationId: string }) {
  const [role, setRole] = useState<RoleName>("editor");
  const [days, setDays] = useState<number>(7);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createInviteLinkAction(organizationId, { role, days, maxUses });
      if (result.ok) setUrl(result.url);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Entran como
          <select value={role} onChange={(e) => setRole(e.currentTarget.value as RoleName)} className={selectClass}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Caduca en
          <select value={days} onChange={(e) => setDays(Number(e.currentTarget.value))} className={selectClass}>
            {INVITE_LINK_DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d === 1 ? "1 día" : `${d} días`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Usos
          <select
            value={maxUses ?? ""}
            onChange={(e) => setMaxUses(e.currentTarget.value ? Number(e.currentTarget.value) : null)}
            className={selectClass}
          >
            {USE_OPTIONS.map((n) => (
              <option key={n ?? "none"} value={n ?? ""}>
                {n === null ? "Sin límite" : n === 1 ? "1 persona" : `${n} personas`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FormAlert message={error} />
      <Button type="submit" variant="secondary" pending={pending} className="self-start">
        <Link2 size={16} strokeWidth={1.75} aria-hidden />
        {pending ? "Creando…" : "Crear enlace"}
      </Button>
      {url ? (
        <div className="flex flex-col gap-1">
          <CopyField value={url} label="Enlace de invitación nuevo" />
          <MarginNote className="block text-lg">cópialo ahora: por seguridad no lo volveremos a enseñar</MarginNote>
        </div>
      ) : null}
    </form>
  );
}
