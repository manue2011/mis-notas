"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { SaveStatus } from "./useAutosave";

const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

function timeAgo(iso: string, now: number): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  if (seconds > -45) return "ahora mismo";
  const minutes = Math.round(seconds / 60);
  if (minutes > -60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

const statusText: Partial<Record<SaveStatus, string>> = {
  pending: "Cambios sin guardar…",
  saving: "Guardando…",
  saved: "Guardado",
};

type Props = {
  /** Real-time editing: the connection's state, shown instead of `status`. */
  liveStatus?: { text: string; tone?: "error" } | null;
  editorName: string | null;
  updatedAt: string;
  status: SaveStatus;
  error: string | null;
  /** The "Historial" button, at the end of the line. */
  history?: ReactNode;
};

export function PageMeta({ liveStatus, editorName, updatedAt, status, error, history }: Props) {
  // Relative time depends on the clock, so it's only shown after hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-ink-muted">
      <span>
        Editado{editorName ? ` por ${editorName}` : ""}
        {now ? ` · ${timeAgo(updatedAt, now)}` : ""}
      </span>
      {liveStatus !== undefined ? (
        <span aria-live="polite" className={liveStatus?.tone === "error" ? "text-error" : undefined}>
          {liveStatus ? `· ${liveStatus.text}` : ""}
        </span>
      ) : (
        <span aria-live="polite" className={status === "error" ? "text-error" : undefined}>
          {status === "error" ? `· ${error}` : statusText[status] ? `· ${statusText[status]}` : ""}
        </span>
      )}
      {history}
    </p>
  );
}
