"use client";

import { useState } from "react";
import { MarginNote } from "@/components/ui/MarginNote";

export function ForgotPasswordHint() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="forgot-password-hint"
        onClick={() => setOpen((v) => !v)}
        className="min-h-11 text-sm text-ink-muted underline decoration-field-line underline-offset-4 hover:text-ink"
      >
        ¿La has olvidado?
      </button>
      {open ? (
        <MarginNote className="-mt-1 -rotate-1">
          <span id="forgot-password-hint" role="status">
            Pídele al administrador que te la cambie.
          </span>
        </MarginNote>
      ) : null}
    </div>
  );
}
