import "server-only";
import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import type { RawImage } from "./png";

// Reads what a PDF shows, page by page: its text pieces and its images, each
// with where it sits on the page, so they can be put back in reading order.

export type TextPiece = { kind: "text"; text: string; x: number; y: number; size: number; endsLine: boolean };
export type ImagePiece = { kind: "image"; top: number; bottom: number; image: RawImage };
export type PdfPage = { number: number; texts: TextPiece[]; images: ImagePiece[] };
export type PdfContents = { title: string | null; pages: PdfPage[] };

/** Smaller ones are icons, bullets or decoration. */
const MIN_IMAGE_SIDE_PX = 48;
const MIN_IMAGE_SIDE_PT = 24;
/** Hard cap per PDF, so a catalogue of thumbnails can't run for minutes. */
export const MAX_IMAGES = 60;
const IMAGE_WAIT_MS = 5000;

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

type PdfImageObject = { width: number; height: number; data?: Uint8Array | Uint8ClampedArray; kind?: number };

/** pdf.js image data to plain 8-bit channels (it packs black and white images 8 pixels per byte). */
function toRaw(object: PdfImageObject): RawImage | null {
  const { width, height, data } = object;
  if (!data || !width || !height) return null;
  const channels = data.length / (width * height);
  if (channels === 1 || channels === 3 || channels === 4) return { width, height, channels, data };

  const rowBytes = Math.ceil(width / 8);
  if (data.length !== rowBytes * height) return null;
  const grey = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grey[y * width + x] = data[y * rowBytes + (x >> 3)] & (0x80 >> (x & 7)) ? 255 : 0;
    }
  }
  return { width, height, channels: 1, data: grey };
}

export async function readPdf(bytes: Uint8Array): Promise<PdfContents> {
  const pdf = await getDocumentProxy(bytes);
  const { OPS } = await getResolvedPDFJS();
  const meta = await pdf.getMetadata().catch(() => null);
  const info = meta?.info as { Title?: unknown } | undefined;
  const title = typeof info?.Title === "string" && info.Title.trim() ? info.Title.trim() : null;

  const pages: PdfPage[] = [];
  let imageCount = 0;
  try {
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);

      const content = await page.getTextContent();
      const texts: TextPiece[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const [, , c, d, e, f] = item.transform as Matrix;
        texts.push({ kind: "text", text: item.str, x: e, y: f, size: Math.hypot(c, d), endsLine: item.hasEOL });
      }

      // Images are drawn as a unit square through the current transform, so
      // follow save/restore/transform (and forms, which carry their own).
      const images: ImagePiece[] = [];
      const ops = await page.getOperatorList();
      const stack: Matrix[] = [];
      let ctm: Matrix = IDENTITY;
      const seen = new Set<string>();
      for (let i = 0; i < ops.fnArray.length && imageCount < MAX_IMAGES; i++) {
        const fn = ops.fnArray[i];
        const args = ops.argsArray[i];
        if (fn === OPS.save) stack.push(ctm);
        else if (fn === OPS.restore) ctm = stack.pop() ?? IDENTITY;
        else if (fn === OPS.transform) ctm = multiply(ctm, args as Matrix);
        else if (fn === OPS.paintFormXObjectBegin) {
          stack.push(ctm);
          if (Array.isArray(args?.[0]) && args[0].length === 6) ctm = multiply(ctm, args[0] as Matrix);
        } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? IDENTITY;
        else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
          const [a, b, c, d, , f] = ctm;
          if (Math.hypot(a, b) < MIN_IMAGE_SIDE_PT || Math.hypot(c, d) < MIN_IMAGE_SIDE_PT) continue;

          let object: PdfImageObject | null;
          if (fn === OPS.paintInlineImageXObject) object = args[0] as PdfImageObject;
          else {
            const key = args[0] as string;
            if (seen.has(key)) continue; // the same picture drawn twice on a page
            seen.add(key);
            const store = key.startsWith("g_") ? page.commonObjs : page.objs;
            object = await Promise.race([
              new Promise<PdfImageObject>((resolve) => store.get(key, resolve)),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), IMAGE_WAIT_MS)),
            ]);
          }
          const raw = object ? toRaw(object) : null;
          if (!raw || raw.width < MIN_IMAGE_SIDE_PX || raw.height < MIN_IMAGE_SIDE_PX) continue;

          const ys = [f, b + f, d + f, b + d + f];
          images.push({ kind: "image", top: Math.max(...ys), bottom: Math.min(...ys), image: raw });
          imageCount++;
        }
      }

      pages.push({ number, texts, images });
      page.cleanup();
    }
  } finally {
    // Frees the parsed document (and its worker state) once read.
    await pdf.loadingTask.destroy();
  }
  return { title, pages };
}
