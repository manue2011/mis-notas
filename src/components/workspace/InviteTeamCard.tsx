"use client";

import { useState, useTransition } from "react";
import { Check, Link2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { MarginNote } from "@/components/ui/MarginNote";
import { createInviteLinkAction, revokeAllInviteLinksAction } from "@/lib/invites/actions";

/** "Trae a tu equipo": creates an invite link and copies it in one click. */
export function InviteTeamCard({ organizationId }: { organizationId: string }) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function copyLink() {
    setError(null);
    setNote(null);
    startTransition(async () => {
      const result = await createInviteLinkAction(organizationId);
      if (!result.ok) return setError(result.error);
      try {
        await navigator.clipboard.writeText(result.url);
        setCopied(result.url);
      } catch {
        // Clipboard can be blocked; show the link so it can be copied by hand.
        setCopied(result.url);
        setNote("No pude copiarlo solo: selecciónalo y cópialo.");
      }
    });
  }

  function revokeAll() {
    setError(null);
    startTransition(async () => {
      const result = await revokeAllInviteLinksAction(organizationId);
      setCopied(null);
      if (result.ok) setNote(result.message);
      else setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="font-hand text-2xl leading-none">Trae a tu equipo</p>
      <p className="mt-2 text-sm text-ink-muted">
        Comparte un enlace y entrarán directamente a este espacio.
      </p>
      <Button onClick={copyLink} pending={pending} className="mt-3 w-full">
        {copied ? <Check size={16} strokeWidth={2} aria-hidden /> : <Link2 size={16} strokeWidth={1.75} aria-hidden />}
        {copied ? "Enlace copiado" : "Copiar enlace de invitación"}
      </Button>
      {copied ? (
        <input
          readOnly
          value={copied}
          aria-label="Enlace de invitación"
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 w-full border-b border-field-line bg-transparent py-1 font-mono text-xs text-ink-muted outline-none"
        />
      ) : null}
      {copied ? (
        <MarginNote className="mt-1 block text-base">entran como editor · caduca en 7 días</MarginNote>
      ) : null}
      {note ? <p className="mt-2 text-sm text-ink-muted" role="status">{note}</p> : null}
      <FormAlert message={error} />
      <button
        type="button"
        onClick={revokeAll}
        disabled={pending}
        className="mt-2 min-h-11 text-xs text-ink-muted underline underline-offset-4 hover:text-ink disabled:opacity-60"
      >
        Anular todos los enlaces
      </button>
    </div>
  );
}
