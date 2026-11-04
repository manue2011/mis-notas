"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
const noop = () => () => {};

/** Looks like the search field; opens the palette. */
export function PaletteTrigger({ onOpen }: { onOpen: () => void }) {
  const mac = useSyncExternalStore(noop, isMac, () => false);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="mx-2 flex min-h-11 items-center gap-2 border-b-[1.5px] border-field-line text-left text-sm text-ink-muted transition-colors duration-150 hover:border-ink-muted hover:text-ink"
    >
      <Search size={16} strokeWidth={1.5} className="shrink-0" aria-hidden />
      <span className="flex-1">Buscar…</span>
      <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans text-[0.7rem]">
        {mac ? "⌘ K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
