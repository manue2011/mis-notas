"use client";

import type { KeyboardEvent } from "react";
import { ACCENTS, ACCENT_KEYS, type AccentKey } from "@/lib/accent";
import { cx } from "@/lib/cx";

type Props = {
  value: AccentKey;
  onChange: (accent: AccentKey) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** The six workspace accents as a keyboard-friendly radio group. */
export function AccentSwatches({ value, onChange, label, disabled, className }: Props) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = ACCENT_KEYS.indexOf(value);
    const next = ACCENT_KEYS[(index + step + ACCENT_KEYS.length) % ACCENT_KEYS.length];
    onChange(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-accent="${next}"]`)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cx("flex flex-wrap gap-1", className)}
    >
      {ACCENT_KEYS.map((key) => {
        const checked = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            data-accent={key}
            aria-checked={checked}
            aria-label={ACCENTS[key].label}
            title={ACCENTS[key].label}
            tabIndex={checked ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(key)}
            className="grid size-12 place-items-center rounded-full disabled:cursor-not-allowed"
          >
            <span
              className={cx(
                "block size-8 rounded-full transition-shadow duration-150",
                checked && "shadow-[0_0_0_3px_var(--panel),0_0_0_5px_currentColor]",
              )}
              style={{ backgroundColor: ACCENTS[key].hex, color: ACCENTS[key].hex }}
            />
          </button>
        );
      })}
    </div>
  );
}
