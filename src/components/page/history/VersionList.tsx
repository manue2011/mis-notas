"use client";

import { Fragment } from "react";
import { cx } from "@/lib/cx";
import type { PageVersionSummary } from "@/lib/pages/version-actions";
import { versionDay, versionTime, versionWhat, versionWho } from "./version-labels";

type Props = {
  versions: PageVersionSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** The versions, newest first, under a heading per day. */
export function VersionList({ versions, selectedId, onSelect }: Props) {
  const now = new Date();
  const days = versions.map((version) => versionDay(version.savedAt, now));
  return (
    <ol aria-label="Versiones" className="flex flex-col gap-0.5">
      {versions.map((version, index) => {
        const day = days[index];
        const newDay = day !== days[index - 1];
        const what = versionWhat(version);
        const selected = version.id === selectedId;
        return (
          <Fragment key={version.id}>
            {newDay ? (
              <li aria-hidden className="px-3 pt-3 pb-1 font-hand text-lg leading-none text-ink-muted first:pt-1">
                {day}
              </li>
            ) : null}
            <li>
              <button
                type="button"
                aria-current={selected || undefined}
                aria-label={`${day}, ${versionTime(version.savedAt)}: ${versionWho(version)}${what ? ` ${what}` : ""}`}
                onClick={() => onSelect(version.id)}
                className={cx(
                  "flex min-h-11 w-full flex-col justify-center rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                  selected ? "bg-accent-soft text-ink" : "text-ink-muted hover:bg-panel hover:text-ink",
                )}
              >
                <span className="flex items-baseline gap-2">
                  <span className="tabular-nums">{versionTime(version.savedAt)}</span>
                  <span className={cx("truncate", selected && "font-medium")}>{versionWho(version)}</span>
                  {index === 0 ? <span className="ml-auto shrink-0 text-xs">ahora</span> : null}
                </span>
                {what ? <span className="text-xs">{what}</span> : null}
              </button>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
