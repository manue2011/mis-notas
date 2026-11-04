"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Ellipsis, FolderInput, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { deletePageAction } from "@/lib/pages/actions";
import { movePageAction } from "@/lib/pages/move";
import type { PageMove } from "@/lib/pages/tree";
import { MoveToForm, type MoveTarget } from "./MoveToForm";
import { PageMenuItem } from "./PageMenuItem";

type Props = {
  organizationId: string;
  pageId: string;
  hasSubpages: boolean;
  canDelete: boolean;
  /** Present when the person may reorder pages (the keyboard-friendly way to "drag"). */
  move?: {
    up: PageMove | null;
    down: PageMove | null;
    parentId: string | null;
    targets: MoveTarget[];
  };
};

type View = "menu" | "delete" | "move";

/** "⋯" menu in the top bar. Deleting asks for confirmation inside the menu. */
export function PageMenu({ organizationId, pageId, hasSubpages, canDelete, move }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    setView("menu");
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
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

  function runMove(target: PageMove) {
    setError(null);
    startTransition(async () => {
      const result = await movePageAction(organizationId, target.pageId, target.parentId, target.beforeId);
      if (result.ok) close();
      else setError(result.error);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Opciones de la página"
        onClick={() => (open ? close() : setOpen(true))}
        className="grid size-11 place-items-center rounded-md text-ink-muted hover:bg-panel hover:text-ink"
      >
        <Ellipsis size={20} strokeWidth={1.5} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 w-72 rounded-lg border border-border bg-surface p-1.5 shadow-paper"
        >
          {view === "delete" ? (
            <div className="flex flex-col gap-3 p-2">
              <p className="text-sm">
                {hasSubpages
                  ? "¿Borrar esta página y todas las que tiene dentro? Desaparecerán para todo el espacio."
                  : "¿Borrar esta página? Desaparecerá para todo el espacio."}
              </p>
              <FormAlert message={error} />
              <div className="flex gap-2">
                <Button pending={pending} onClick={remove} className="bg-error text-white">
                  {pending ? "Borrando…" : "Borrar"}
                </Button>
                <Button variant="ghost" onClick={() => setView("menu")}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : view === "move" && move ? (
            <>
              <MoveToForm
                pageId={pageId}
                currentParentId={move.parentId}
                targets={move.targets}
                pending={pending}
                onMove={runMove}
                onCancel={() => setView("menu")}
              />
              <FormAlert message={error} />
            </>
          ) : (
            <>
              {move ? (
                <>
                  <PageMenuItem
                    icon={ArrowUp}
                    autoFocus
                    disabled={!move.up || pending}
                    onClick={() => move.up && runMove(move.up)}
                  >
                    Subir
                  </PageMenuItem>
                  <PageMenuItem
                    icon={ArrowDown}
                    disabled={!move.down || pending}
                    onClick={() => move.down && runMove(move.down)}
                  >
                    Bajar
                  </PageMenuItem>
                  <PageMenuItem icon={FolderInput} onClick={() => setView("move")}>
                    Mover a…
                  </PageMenuItem>
                </>
              ) : null}
              {canDelete ? (
                <PageMenuItem icon={Trash2} autoFocus={!move} danger onClick={() => setView("delete")}>
                  Borrar página
                </PageMenuItem>
              ) : null}
              <FormAlert message={error} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
