"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PageMove } from "@/lib/pages/tree";

export type MoveTarget = { id: string; label: string; depth: number };

type Props = {
  pageId: string;
  currentParentId: string | null;
  targets: MoveTarget[];
  pending: boolean;
  onMove: (move: PageMove) => void;
  onCancel: () => void;
};

const TOP_LEVEL = "";
// <option> collapses normal spaces, so nesting is shown with non-breaking ones.
const NBSP = "\u00a0";

/** "Mover a…": pick the page this one goes inside (it lands last there). */
export function MoveToForm({ pageId, currentParentId, targets, pending, onMove, onCancel }: Props) {
  const id = useId();
  const [parent, setParent] = useState(currentParentId ?? TOP_LEVEL);

  return (
    <form
      className="flex flex-col gap-3 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        onMove({ pageId, parentId: parent || null, beforeId: null });
      }}
    >
      <label htmlFor={id} className="text-sm font-medium">
        Mover dentro de
      </label>
      <select
        id={id}
        autoFocus
        value={parent}
        onChange={(e) => setParent(e.target.value)}
        className="min-h-11 w-full border-0 border-b border-field-line bg-transparent text-sm focus:border-accent focus:outline-none"
      >
        <option value={TOP_LEVEL}>Ninguna (primer nivel)</option>
        {targets.map((t) => (
          <option key={t.id} value={t.id}>
            {NBSP.repeat(t.depth * 2)}
            {t.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" pending={pending} disabled={parent === (currentParentId ?? TOP_LEVEL)}>
          {pending ? "Moviendo…" : "Mover"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
