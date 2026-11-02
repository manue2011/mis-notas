"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Ellipsis, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { deletePageAction } from "@/lib/pages/actions";

/** "⋯" menu in the top bar. Deleting asks for confirmation inside the menu. */
export function PageMenu({ organizationId, pageId }: { organizationId: string; pageId: string }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setConfirming(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function remove() {
    setError(null);
    startTransition(async () => {
      // Redirects to the workspace on success.
      const result = await deletePageAction(organizationId, pageId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Opciones de la página"
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center rounded-md text-ink-muted hover:bg-panel hover:text-ink"
      >
        <Ellipsis size={20} strokeWidth={1.5} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 w-64 rounded-lg border border-border bg-surface p-1.5 shadow-paper"
        >
          {confirming ? (
            <div className="flex flex-col gap-3 p-2">
              <p className="text-sm">¿Borrar esta página? Desaparecerá para todo el espacio.</p>
              <FormAlert message={error} />
              <div className="flex gap-2">
                <Button pending={pending} onClick={remove} className="bg-error text-white">
                  {pending ? "Borrando…" : "Borrar"}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={() => setConfirming(true)}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-error hover:bg-panel"
            >
              <Trash2 size={16} strokeWidth={1.5} aria-hidden />
              Borrar página
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
