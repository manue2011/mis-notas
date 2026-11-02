"use client";

import { useActionState } from "react";
import { Link2 } from "lucide-react";
import { createInviteAction, type CreateInviteResult } from "@/app/admin/actions";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { MarginNote } from "@/components/ui/MarginNote";
import { TextField } from "@/components/ui/TextField";

export function InviteCreator() {
  const [state, action, pending] = useActionState<CreateInviteResult, FormData>(
    createInviteAction,
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <TextField
          label="¿Para quién es? (opcional)"
          name="note"
          maxLength={80}
          placeholder="Ana, de diseño"
          className="flex-1"
        />
        <Button type="submit" pending={pending}>
          <Link2 size={16} strokeWidth={1.75} aria-hidden />
          Crear enlace
        </Button>
      </form>

      {state && "error" in state ? <FormAlert message={state.error} /> : null}
      {state && "url" in state ? (
        <div className="flex flex-col gap-1">
          <CopyField value={state.url} label="Enlace de registro" />
          <MarginNote>
            cópialo ahora: por seguridad no se vuelve a mostrar. Sirve una vez y caduca en 7 días.
          </MarginNote>
        </div>
      ) : null}
    </div>
  );
}
