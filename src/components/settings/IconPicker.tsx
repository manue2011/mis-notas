"use client";

import type { KeyboardEvent } from "react";
import { Monogram } from "@/components/ui/Monogram";
import { WorkspaceMark } from "@/components/ui/WorkspaceMark";
import type { AccentKey } from "@/lib/accent";
import { cx } from "@/lib/cx";
import { WORKSPACE_ICON_KEYS, WORKSPACE_ICONS, type WorkspaceIconKey } from "@/lib/workspace/icons";

type Props = {
  name: string;
  accent: AccentKey;
  value: WorkspaceIconKey | null;
  onChange: (icon: WorkspaceIconKey | null) => void;
};

const OPTIONS: (WorkspaceIconKey | null)[] = [null, ...WORKSPACE_ICON_KEYS];

/** The workspace's icon: its initial, or one of a short list. A radio group. */
export function IconPicker({ name, accent, value, onChange }: Props) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = OPTIONS[(OPTIONS.indexOf(value) + step + OPTIONS.length) % OPTIONS.length];
    onChange(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-icon="${next ?? "initial"}"]`)?.focus();
  }

  return (
    <div role="radiogroup" aria-label="Icono del espacio" onKeyDown={handleKeyDown} className="flex flex-wrap gap-1">
      {OPTIONS.map((key) => {
        const checked = value === key;
        const label = key ? WORKSPACE_ICONS[key].label : "Inicial del nombre";
        return (
          <button
            key={key ?? "initial"}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            title={label}
            data-icon={key ?? "initial"}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(key)}
            className={cx(
              "grid size-11 place-items-center rounded-lg border-2 transition-colors",
              checked ? "border-accent-ink" : "border-transparent hover:border-border",
            )}
          >
            {key ? (
              <WorkspaceMark name={name} accent={accent} icon={key} className="size-8" />
            ) : (
              <Monogram name={name} accent={accent} className="size-8" />
            )}
          </button>
        );
      })}
    </div>
  );
}
