"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { cx } from "@/lib/cx";
import { createPageAction } from "@/lib/pages/actions";

type Props = {
  organizationId: string;
  parentId: string;
  parentTitle: string;
  onCreate: () => void;
};

/** "+" at the end of a sidebar row. Hidden until hover/focus on devices with a mouse. */
export function AddSubpageButton({ organizationId, parentId, parentTitle, onCreate }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    setError(null);
    onCreate();
    startTransition(async () => {
      // Redirects to the new page on success.
      const result = await createPageAction(organizationId, parentId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={pending}
      aria-label={`Nueva subpágina en ${parentTitle}`}
      title={error ?? "Nueva subpágina"}
      className={cx(
        "absolute top-0 right-0 grid size-11 place-items-center rounded-lg text-ink-muted hover:text-ink",
        "pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100",
        (pending || error) && "opacity-100!",
        error && "text-error",
      )}
    >
      {pending ? (
        <LoaderCircle size={16} strokeWidth={1.5} aria-hidden className="animate-spin motion-reduce:animate-none" />
      ) : (
        <Plus size={16} strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}
