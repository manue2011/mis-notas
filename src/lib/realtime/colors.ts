import { ACCENT_KEYS, accentHex } from "@/lib/accent";

/** A steady colour per person (their cursor, their avatar), from the accent palette. */
export function personColor(userId: string): string {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  // Graphite would read as plain ink; skip it.
  const keys = ACCENT_KEYS.filter((key) => key !== "graphite");
  return accentHex(keys[Math.abs(hash) % keys.length]);
}
