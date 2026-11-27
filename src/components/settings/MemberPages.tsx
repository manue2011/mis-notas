"use client";

import { useState, useTransition } from "react";
import { Eye } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { setMemberPagesAction } from "@/lib/members/actions";
import { scopeSummary } from "@/lib/pages/scope-summary";
import type { FlatPage } from "@/lib/pages/tree";
import { PageScopePicker } from "./PageScopePicker";

type Props = {
  organizationId: string;
  memberId: string;
  name: string;
  role: string;
  /** null: the whole workspace. */
  pageIds: string[] | null;
  pages: FlatPage[];
};

/** "Ve: …" next to a member: what they see, and changing it. */
export function MemberPages({ organizationId, memberId, name, role, pageIds, pages }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(pageIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (role === "admin") {
    return <p className="text-sm text-ink-muted">Ve todo el cuaderno, como administrador.</p>;
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setMemberPagesAction(organizationId, memberId, draft);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setDraft(pageIds);
          setError(null);
          setOpen((v) => !v);
        }}
        className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-panel"
      >
        <Eye size={16} strokeWidth={1.5} aria-hidden />
        <span>
          Ve: <span className="font-medium">{scopeSummary(pages, pageIds)}</span>
        </span>
      </button>
      {open ? (
        <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-border bg-surface p-3">
          <p className="text-sm text-ink-muted">
            Qué páginas puede ver {name}. Con una página van también las que tiene dentro.
          </p>
          <PageScopePicker pages={pages} value={draft} onChange={setDraft} disabled={pending} />
          <FormAlert message={error} />
          <div className="flex gap-2">
            <Button pending={pending} disabled={draft?.length === 0} onClick={save}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
