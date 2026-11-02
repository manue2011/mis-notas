"use client";

import { useTransition } from "react";
import { revokeInviteAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      pending={pending}
      onClick={() => startTransition(async () => void (await revokeInviteAction(inviteId)))}
    >
      {pending ? "Anulando…" : "Anular"}
    </Button>
  );
}
