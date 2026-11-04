"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { AccentKey } from "@/lib/accent";
import { isWorkspaceIcon, type WorkspaceFontKey, type WorkspaceIconKey } from "@/lib/workspace/icons";
import { updateWorkspaceGeneralAction } from "@/lib/workspace/actions";
import { FontPicker } from "./FontPicker";
import { IconPicker } from "./IconPicker";

type Props = {
  organizationId: string;
  name: string;
  icon: string | null;
  font: WorkspaceFontKey;
  accent: AccentKey;
};

export function GeneralSettingsForm({ organizationId, accent, ...initial }: Props) {
  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState<WorkspaceIconKey | null>(isWorkspaceIcon(initial.icon) ? initial.icon : null);
  const [font, setFont] = useState<WorkspaceFontKey>(initial.font);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Any change hides the "saved" tick until the next save.
  const touch = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setSaved(false);
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateWorkspaceGeneralAction({ organizationId, name, icon, font });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-8">
      <TextField
        label="Nombre"
        required
        maxLength={60}
        value={name}
        onChange={(e) => touch(setName)(e.currentTarget.value)}
        hint="Cambiar el nombre no cambia la dirección del espacio: los enlaces guardados siguen funcionando."
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Icono</legend>
        <IconPicker name={name} accent={accent} value={icon} onChange={touch(setIcon)} />
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Tipografía de las notas</legend>
        <FontPicker value={font} onChange={touch(setFont)} />
        <p className="text-sm text-ink-muted">Cambia el texto de las páginas; los menús y botones no cambian.</p>
      </fieldset>
      <FormAlert message={error} />
      <div className="flex items-center gap-4">
        <Button type="submit" pending={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
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
