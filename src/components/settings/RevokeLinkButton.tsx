"use client";

import { useState, useTransition } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { revokeInviteLinkAction } from "@/lib/invites/actions";

export function RevokeLinkButton({ organizationId, linkId }: { organizationId: string; linkId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function revoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeInviteLinkAction(organizationId, linkId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="danger" pending={pending} onClick={revoke}>
        {pending ? "Anulando…" : "Anular"}
      </Button>
      <FormAlert message={error} />
    </div>
  );
}
