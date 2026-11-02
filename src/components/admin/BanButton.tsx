"use client";

import { useState, useTransition } from "react";
import { Ban, Undo2 } from "lucide-react";
import { setBannedAction } from "@/app/admin/actions";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";

export function BanButton({ userId, banned }: { userId: string; banned: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const Icon = banned ? Undo2 : Ban;

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="ghost"
        pending={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setBannedAction(userId, !banned);
            setError(result.ok ? null : result.error);
          })
        }
      >
        <Icon size={16} strokeWidth={1.75} aria-hidden />
        {banned ? "Desbloquear" : "Bloquear"}
      </Button>
      <FormAlert message={error} />
    </div>
  );
}
