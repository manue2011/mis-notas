export const ACCENTS = {
  ink_blue: { label: "Azul tinta", hex: "#2F5D8A" },
  tile: { label: "Teja", hex: "#B5432E" },
  moss: { label: "Musgo", hex: "#4E6E2F" },
  mustard: { label: "Mostaza tostada", hex: "#8F5A0B" },
  plum: { label: "Ciruela", hex: "#6B4C8A" },
  graphite: { label: "Grafito", hex: "#3A342D" },
} as const;

export type AccentKey = keyof typeof ACCENTS;

export const ACCENT_KEYS = Object.keys(ACCENTS) as [AccentKey, ...AccentKey[]];

export const DEFAULT_ACCENT: AccentKey = "ink_blue";

export function accentHex(key: AccentKey): string {
  return ACCENTS[key].hex;
}
