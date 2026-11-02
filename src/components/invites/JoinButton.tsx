"use client";

import { useState, useTransition } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { acceptInviteAction } from "@/lib/invites/actions";

export function JoinButton({ token, workspaceName }: { token: string; workspaceName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="w-full"
        pending={pending}
        onClick={() =>
          startTransition(async () => {
            // Redirects into the workspace on success.
            const result = await acceptInviteAction(token);
            if (result?.error) setError(result.error);
          })
        }
      >
        {pending ? "Entrando…" : `Unirme a ${workspaceName}`}
      </Button>
      <FormAlert message={error} />
    </div>
  );
}
