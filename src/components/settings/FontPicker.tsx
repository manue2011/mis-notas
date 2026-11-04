"use client";

import type { KeyboardEvent } from "react";
import { cx } from "@/lib/cx";
import { WORKSPACE_FONT_KEYS, WORKSPACE_FONTS, type WorkspaceFontKey } from "@/lib/workspace/icons";

const fontClass: Record<WorkspaceFontKey, string> = {
  serif: "font-serif",
  sans: "font-sans",
  mono: "font-mono",
};

type Props = { value: WorkspaceFontKey; onChange: (font: WorkspaceFontKey) => void };

/** The typeface for the text of the notes, each option written in itself. */
export function FontPicker({ value, onChange }: Props) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const keys = WORKSPACE_FONT_KEYS;
    const next = keys[(keys.indexOf(value) + step + keys.length) % keys.length];
    onChange(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-font="${next}"]`)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tipografía de las notas"
      onKeyDown={handleKeyDown}
      className="grid gap-2 sm:grid-cols-3"
    >
      {WORKSPACE_FONT_KEYS.map((key) => {
        const checked = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={checked}
            data-font={key}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(key)}
            className={cx(
              "flex min-h-11 flex-col items-start gap-1 rounded-lg border-2 bg-surface px-4 py-3 text-left transition-colors",
              checked ? "border-accent-ink" : "border-border hover:border-field-line",
            )}
          >
            <span className="text-sm font-medium">{WORKSPACE_FONTS[key].label}</span>
            <span className={cx("text-lg leading-snug text-ink-muted", fontClass[key])}>
              {WORKSPACE_FONTS[key].sample}
            </span>
          </button>
        );
      })}
    </div>
  );
}
