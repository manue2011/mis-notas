import { randomBytes } from "node:crypto";

/** "Equipo Diseño" → "equipo-diseno-x7k2". The suffix keeps slugs unique. */
export function workspaceSlug(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex").slice(0, 4);
  return base ? `${base}-${suffix}` : `espacio-${suffix}`;
}
