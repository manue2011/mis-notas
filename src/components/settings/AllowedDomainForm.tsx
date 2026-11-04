"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { setAllowedDomainAction } from "@/lib/workspace/actions";

type Props = { organizationId: string; domain: string | null };

export function AllowedDomainForm({ organizationId, domain }: Props) {
  const [value, setValue] = useState(domain ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(next: string) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setAllowedDomainAction(organizationId, next);
      if (!result.ok) return setError(result.error);
      setValue(next.trim().toLowerCase().replace(/^@/, ""));
      setSaved(true);
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    save(value);
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-4">
      <TextField
        label="Dominio de correo permitido"
        value={value}
        onChange={(e) => {
          setValue(e.currentTarget.value);
          setSaved(false);
        }}
        placeholder="empresa.com"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={253}
        trailing={<span className="pl-2 text-sm text-ink-muted">opcional</span>}
        hint={
          value.trim()
            ? `Solo podrán entrar con un enlace quienes tengan un correo …@${value.trim().replace(/^@/, "")}.`
            : "Sin dominio, cualquiera con un enlace de invitación puede entrar."
        }
        error={error ?? undefined}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" pending={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        {domain ? (
          <Button variant="ghost" disabled={pending} onClick={() => save("")}>
            Quitar la restricción
          </Button>
        ) : null}
        {saved ? (
          <span role="status" className="flex items-center gap-1.5 text-sm text-ink-muted">
            <Check size={16} strokeWidth={1.75} aria-hidden />
            Guardado
          </span>
        ) : null}
      </div>
    </form>
  );
}
