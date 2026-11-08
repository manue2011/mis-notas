import type { PdfPage, TextPiece } from "./read";

// Turns a PDF's positioned text and images into notebook blocks, in reading
// order. PDFs only know "this text at this spot": paragraphs, headings and
// lists are guessed from line spacing, font size and leading markers.

export type TextKind = "paragraph" | "heading" | "bulletListItem" | "numberedListItem";
export type Piece =
  | { type: TextKind; text: string; level?: 1 | 2 | 3 }
  | { type: "image"; page: number; index: number; caption: string | null }
  /** A page with nothing to extract (vector drawing, odd scan): taken whole. */
  | { type: "pageImage"; page: number };

type Line = { text: string; y: number; size: number };

const BULLET = /^[•·▪◦‣●○■□➢►\-–—*]\s+/;
const NUMBERED = /^(\d{1,3}|[a-zA-Z])[.)]\s+/;
const PAGE_NUMBER = /^(p(á|a)g(ina)?\.?\s*)?\d{1,4}(\s*(de|\/|of)\s*\d{1,4})?$/i;
const MAX_HEADING_CHARS = 150;

function toLines(texts: TextPiece[]): Line[] {
  const lines: Line[] = [];
  let current: (Line & { open: boolean }) | null = null;
  for (const piece of texts) {
    const sameLine =
      current?.open && Math.abs(piece.y - current.y) < Math.max(piece.size, current.size, 1) * 0.6;
    if (current && sameLine) {
      current.text += piece.text;
      current.size = Math.max(current.size, piece.size);
    } else {
      if (current) lines.push(current);
      current = { text: piece.text, y: piece.y, size: piece.size, open: true };
    }
    if (piece.endsLine) current.open = false;
  }
  if (current) lines.push(current);

  return lines
    .map((line) => ({ text: line.text.replace(/\s+/g, " ").trim(), y: line.y, size: line.size }))
    .filter((line) => line.text && !PAGE_NUMBER.test(line.text));
}

/** The body text size: the most common one, weighted by how much text uses it. */
function bodySize(pages: Line[][]): number {
  const weight = new Map<number, number>();
  for (const line of pages.flat()) {
    const size = Math.round(line.size * 2) / 2;
    weight.set(size, (weight.get(size) ?? 0) + line.text.length);
  }
  let best = 10;
  let most = -1;
  for (const [size, w] of weight) if (w > most) [best, most] = [size, w];
  return best;
}

function classify(line: Line, body: number): { type: TextKind; text: string; level?: 1 | 2 | 3 } {
  if (BULLET.test(line.text)) return { type: "bulletListItem", text: line.text.replace(BULLET, "") };
  if (NUMBERED.test(line.text)) return { type: "numberedListItem", text: line.text.replace(NUMBERED, "") };
  const ratio = line.size / body;
  if (ratio >= 1.15 && line.text.length <= MAX_HEADING_CHARS) {
    return { type: "heading", text: line.text, level: ratio >= 1.8 ? 1 : ratio >= 1.35 ? 2 : 3 };
  }
  return { type: "paragraph", text: line.text };
}

/** Joins wrapped lines, undoing words split with a hyphen at the line end. */
function join(left: string, right: string): string {
  if (/[a-záéíóúñü]-$/i.test(left) && /^[a-záéíóúñü]/.test(right)) return left.slice(0, -1) + right;
  return `${left} ${right}`;
}

export function layoutPdf(pages: PdfPage[]): Piece[] {
  const linesByPage = pages.map((page) => toLines(page.texts));
  const body = bodySize(linesByPage);
  const pieces: Piece[] = [];

  pages.forEach((page, p) => {
    const lines = linesByPage[p];
    if (lines.length === 0 && page.images.length === 0) {
      pieces.push({ type: "pageImage", page: page.number });
      return;
    }
    // A page that's only pictures is most likely a scan: say which page it was.
    const caption = lines.length === 0 ? `pág. ${page.number}` : null;

    // Each image goes before the first line that starts below its top edge.
    const pending = page.images.map((image, index) => ({ top: image.top, index })).sort((a, b) => b.top - a.top);
    let open: { type: TextKind; text: string; level?: 1 | 2 | 3; y: number; size: number } | null = null;
    const close = () => {
      if (open) pieces.push({ type: open.type, text: open.text, ...(open.level ? { level: open.level } : {}) });
      open = null;
    };

    for (const line of lines) {
      const lineTop = line.y + line.size;
      while (pending.length && pending[0].top >= lineTop) {
        close();
        pieces.push({ type: "image", page: page.number, index: pending.shift()!.index, caption });
      }

      const next = classify(line, body);
      const gap = open ? open.y - line.y : 0;
      const continues =
        open !== null &&
        gap > 0 &&
        gap <= Math.max(open.size, line.size) * 1.9 &&
        // Wrapped text continues its paragraph, list item or heading.
        ((next.type === "paragraph" && open.type !== "heading") ||
          (next.type === "heading" && open.type === "heading" && next.level === open.level));
      if (continues && open) {
        open.text = join(open.text, next.text);
        open.y = line.y;
      } else {
        close();
        open = { ...next, y: line.y, size: line.size };
      }
    }
    close();
    for (const { index } of pending) pieces.push({ type: "image", page: page.number, index, caption });
  });

  return pieces;
}
