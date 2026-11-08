"use client";

import { useActionState, useRef, useState } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { AccentSelect } from "@/components/ui/AccentSelect";
import { Button } from "@/components/ui/Button";
import { Monogram } from "@/components/ui/Monogram";
import { TextField } from "@/components/ui/TextField";
import { accentHex, DEFAULT_ACCENT, type AccentKey } from "@/lib/accent";
import { createWorkspaceAction, type CreateWorkspaceState } from "@/lib/workspace/actions";

export function NewWorkspaceForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [accent, setAccent] = useState<AccentKey>(DEFAULT_ACCENT);
  const [state, action, pending] = useActionState<CreateWorkspaceState, FormData>(
    createWorkspaceAction,
    null,
  );

  // Previews the whole page in the color.
  function paint(next: AccentKey) {
    ref.current?.closest<HTMLElement>(".accent-scope")?.style.setProperty("--accent", accentHex(next));
  }

  function pickAccent(next: AccentKey) {
    setAccent(next);
    paint(next);
  }

  return (
    <form ref={ref} action={action} className="flex flex-col gap-8">
      <input type="hidden" name="accent" value={accent} />
      <div className="flex items-end gap-3">
        <Monogram name={name || "?"} accent={accent} className="mb-2 size-10 text-lg" />
        <TextField
          label="Nombre del espacio"
          name="name"
          required
          maxLength={60}
          placeholder="Equipo Diseño"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          className="flex-1"
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink-muted">Color del espacio</legend>
        <AccentSelect
          value={accent}
          onChange={pickAccent}
          onPreview={paint}
          label="Color del espacio"
          className="max-w-xs"
        />
      </fieldset>
      <FormAlert message={state?.error ?? null} />
      <Button type="submit" pending={pending} className="w-full sm:w-auto sm:self-start">
        {pending ? "Preparando el cuaderno…" : "Crear espacio"}
      </Button>
    </form>
  );
}
