import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { asset } from "@/db/schema";
import {
  destroyImage,
  fetchImage,
  MAX_UPLOAD_BYTES,
  pdfPageImageUrl,
  uploadImageFromServer,
  workspaceFolder,
  type CloudinaryResource,
} from "@/lib/cloudinary/server";
import type { WorkspaceAccess } from "@/lib/workspace/access";
import { layoutPdf, type Piece } from "./layout";
import { encodePng, shrinkToFit, type RawImage } from "./png";
import { readPdf } from "./read";

/** Where the browser uploads the PDF (signed); it's deleted once imported. */
export const pdfFolder = (organizationId: string) => `${workspaceFolder(organizationId)}/pdf`;

/** Longest side of an image taken from a PDF; plenty for a note, and keeps uploads small. */
const MAX_IMAGE_SIDE = 2400;
const UPLOADS_AT_ONCE = 4;

export class PdfImportError extends Error {}

export type ImportedPdf = { title: string | null; blocks: unknown[]; pages: number; images: number };

const text = (value: string) => [{ type: "text", text: value, styles: {} }];

async function uploadRaw(image: RawImage, folder: string) {
  let side = MAX_IMAGE_SIDE;
  let png = encodePng(shrinkToFit(image, side));
  while (png.length > MAX_UPLOAD_BYTES && side > 300) {
    side = Math.floor(side / 2);
    png = encodePng(shrinkToFit(image, side));
  }
  return uploadImageFromServer(new Blob([new Uint8Array(png)], { type: "image/png" }), { folder, publicId: randomUUID() });
}

/** Runs `fn` over the items, a few at a time, keeping their order. */
async function mapLimited<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(UPLOADS_AT_ONCE, items.length) }, worker));
  return results;
}

/**
 * Turns an uploaded PDF into blocks for the page: its text as paragraphs,
 * headings and lists, and its images as screenshots in the same order.
 */
export async function importPdf(access: WorkspaceAccess, pageId: string, uploadId: string): Promise<ImportedPdf> {
  const pdfId = `${pdfFolder(access.organizationId)}/${uploadId}`;
  const stored = await fetchImage(pdfId);
  if (!stored) throw new PdfImportError("No encontramos el PDF subido. Vuelve a intentarlo.");

  try {
    if (stored.format !== "pdf" || stored.bytes > MAX_UPLOAD_BYTES) {
      throw new PdfImportError("El archivo no es un PDF de 10 MB o menos.");
    }
    const res = await fetch(stored.secure_url, { cache: "no-store" });
    if (!res.ok) {
      console.error("[pdf] download failed", res.status);
      throw new PdfImportError(
        "Cloudinary no deja descargar el PDF. Revisa que esté activado «Allow delivery of PDF and ZIP files».",
      );
    }

    const contents = await readPdf(new Uint8Array(await res.arrayBuffer())).catch((error: unknown) => {
      console.error("[pdf] read failed", error);
      throw new PdfImportError("No hemos podido leer este PDF. ¿Está protegido con contraseña o dañado?");
    });
    const pieces = layoutPdf(contents.pages);

    // Upload every picture first, then build the blocks in order.
    const folder = workspaceFolder(access.organizationId);
    const pictures = pieces.filter((p) => p.type === "image" || p.type === "pageImage");
    const uploaded = await mapLimited(pictures, (piece): Promise<CloudinaryResource> =>
      piece.type === "image"
        ? uploadRaw(contents.pages[piece.page - 1].images[piece.index].image, folder)
        : uploadImageFromServer(pdfPageImageUrl(pdfId, piece.page), { folder, publicId: randomUUID() }),
    );
    const rows = uploaded.length
      ? await db
          .insert(asset)
          .values(
            uploaded.map((image) => ({
              organizationId: access.organizationId,
              pageId,
              cloudinaryPublicId: image.public_id,
              url: image.secure_url,
              width: image.width,
              height: image.height,
              bytes: image.bytes,
              uploadedBy: access.userId,
            })),
          )
          .returning({ id: asset.id })
      : [];

    let picture = 0;
    const blocks = pieces.map((piece: Piece) => {
      if (piece.type === "image" || piece.type === "pageImage") {
        const image = uploaded[picture];
        const assetId = rows[picture].id;
        picture++;
        const caption = piece.type === "pageImage" ? `pág. ${piece.page}` : piece.caption;
        return {
          type: "screenshot",
          props: { url: image.secure_url, assetId, width: image.width, height: image.height },
          content: caption ? text(caption) : [],
        };
      }
      return { type: piece.type, ...(piece.level ? { props: { level: piece.level } } : {}), content: text(piece.text) };
    });

    return { title: contents.title, blocks, pages: contents.pages.length, images: uploaded.length };
  } finally {
    // Only the PDF itself: its page renders were uploaded as images of their own.
    await destroyImage(pdfId).catch((error) => console.error("[pdf] cleanup failed", error));
  }
}
