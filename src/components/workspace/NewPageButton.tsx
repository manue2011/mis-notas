"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cx";
import { createPageAction } from "@/lib/pages/actions";

type Props = {
  organizationId: string;
  /** Creates a sub-page of this page instead of a top-level one. */
  parentId?: string;
  variant?: "sidebar" | "primary";
  label?: string;
};

export function NewPageButton({ organizationId, parentId, variant = "sidebar", label = "Nueva página" }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    setError(null);
    startTransition(async () => {
      // Redirects to the new page on success.
      const result = await createPageAction(organizationId, parentId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant === "primary" ? "primary" : "ghost"}
        pending={pending}
        onClick={create}
        className={cx(variant === "sidebar" && "justify-start px-2.5 text-ink-muted hover:text-ink")}
      >
        <Plus size={16} strokeWidth={1.5} aria-hidden />
        {pending ? "Creando…" : label}
      </Button>
      <FormAlert message={error} />
    </div>
  );
}
