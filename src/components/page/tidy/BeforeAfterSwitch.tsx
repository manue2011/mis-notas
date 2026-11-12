"use client";

import type { KeyboardEvent } from "react";
import { cx } from "@/lib/cx";

export type TidyView = "after" | "before";

const OPTIONS: { value: TidyView; label: string }[] = [
  { value: "after", label: "Después" },
  { value: "before", label: "Antes" },
];

/** Después / Antes, as a small segmented radio group. */
export function BeforeAfterSwitch({ value, onChange }: { value: TidyView; onChange: (view: TidyView) => void }) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const next = value === "after" ? "before" : "after";
    onChange(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Ver la página"
      onKeyDown={handleKeyDown}
      className="grid w-52 shrink-0 grid-cols-2 gap-0.5 rounded-lg bg-panel p-0.5"
    >
      {OPTIONS.map(({ value: option, label }) => {
        const checked = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={checked}
            data-view={option}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option)}
            className={cx(
              "min-h-11 rounded-md text-sm transition-colors",
              checked ? "bg-paper font-medium text-ink shadow-paper" : "text-ink-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
