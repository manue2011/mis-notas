"use client";

import { useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import { applyThemeChoice, readThemeChoice, type ThemeChoice } from "@/lib/theme";

const OPTIONS: { value: ThemeChoice; label: string; Icon: LucideIcon }[] = [
  { value: "system", label: "Sistema", Icon: Monitor },
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
];

const noop = () => () => {};

/** Sistema / Claro / Oscuro, as a small segmented radio group. */
export function ThemeSwitcher({ className }: { className?: string }) {
  // The cookie is only readable in the browser; the server renders "Sistema".
  const stored = useSyncExternalStore(noop, readThemeChoice, () => "system" as ThemeChoice);
  const [picked, setPicked] = useState<ThemeChoice | null>(null);
  const value = picked ?? stored;

  function choose(next: ThemeChoice) {
    applyThemeChoice(next);
    setPicked(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = OPTIONS.findIndex((o) => o.value === value);
    const next = OPTIONS[(index + step + OPTIONS.length) % OPTIONS.length].value;
    choose(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-theme-option="${next}"]`)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      onKeyDown={handleKeyDown}
      className={cx("grid grid-cols-3 gap-0.5 rounded-lg bg-surface/70 p-0.5", className)}
    >
      {OPTIONS.map(({ value: option, label, Icon }) => {
        const checked = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={checked}
            data-theme-option={option}
            tabIndex={checked ? 0 : -1}
            onClick={() => choose(option)}
            className={cx(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-md text-xs transition-colors",
              checked ? "bg-paper font-medium text-ink shadow-paper" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon size={14} strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
