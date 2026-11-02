"use client";

import { useActionState, useState } from "react";
import { KeyRound } from "lucide-react";
import { setPasswordAction, type ActionResult } from "@/app/admin/actions";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { MarginNote } from "@/components/ui/MarginNote";
import { PasswordField } from "@/components/ui/PasswordField";

export function SetPasswordForm({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const result = await setPasswordAction(prev, formData);
      // Collapse on success; the result note shows under the button.
      if (result.ok) setOpen(false);
      return result;
    },
    null,
  );

  if (!open) {
    return (
      <div className="flex flex-col items-start">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <KeyRound size={16} strokeWidth={1.75} aria-hidden />
          Cambiar contraseña
        </Button>
        {state?.ok ? <MarginNote className="mt-1">{state.message}</MarginNote> : null}
      </div>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-3">
      <input type="hidden" name="userId" value={userId} />
      <PasswordField
        label={`Nueva contraseña para ${userName}`}
        name="password"
        autoComplete="new-password"
        minLength={8}
        required
        autoFocus
        hint="Al guardarla se cerrarán todas sus sesiones."
      />
      {state && !state.ok ? <FormAlert message={state.error} /> : null}
      <div className="flex gap-2">
        <Button type="submit" pending={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
