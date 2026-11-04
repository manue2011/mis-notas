"use client";

import { MarginNote } from "@/components/ui/MarginNote";

export function ForgotPasswordButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="forgot-password-hint"
      onClick={onToggle}
      className="-my-3 min-h-11 text-sm text-accent-ink underline underline-offset-4 hover:brightness-125"
    >
      ¿La has olvidado?
    </button>
  );
}

export function ForgotPasswordNote({ open }: { open: boolean }) {
  return (
    <div id="forgot-password-hint" role="status">
      {open ? (
        <MarginNote className="mt-1 block -rotate-1">Pídele al administrador que te la cambie.</MarginNote>
      ) : null}
    </div>
  );
}
