"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./Button";

/** A read-only value with a copy button, e.g. an invite link. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const Icon = copied ? Check : Copy;

  return (
    <div className="flex items-center gap-2 border-b-[1.5px] border-field-line">
      <input
        readOnly
        value={value}
        aria-label={label}
        onFocus={(e) => e.currentTarget.select()}
        className="min-h-11 w-full min-w-0 bg-transparent font-mono text-sm text-ink outline-none"
      />
      <Button variant="ghost" onClick={copy} className="shrink-0">
        <Icon size={16} strokeWidth={1.75} aria-hidden />
        <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
      </Button>
    </div>
  );
}
