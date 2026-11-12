import type { PageVersionSummary } from "@/lib/pages/version-actions";

// How a version is named in the history: who, what and when.

const time = new Intl.DateTimeFormat("es", { hour: "numeric", minute: "2-digit" });
const date = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
const dateWithYear = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Hoy", "Ayer", "5 nov" or "5 nov 2025". */
export function versionDay(iso: string, now: Date): string {
  const when = new Date(iso);
  const days = Math.round((dayStart(now) - dayStart(when)) / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return (when.getFullYear() === now.getFullYear() ? date : dateWithYear).format(when);
}

export const versionTime = (iso: string) => time.format(new Date(iso));

export function versionWho(version: Pick<PageVersionSummary, "editedByName">): string {
  return version.editedByName ?? "Alguien";
}

export function versionWhat(version: Pick<PageVersionSummary, "kind">): string | null {
  if (version.kind === "ai") return "ordenó con IA";
  if (version.kind === "restore") return "restauró una versión";
  return null;
}
