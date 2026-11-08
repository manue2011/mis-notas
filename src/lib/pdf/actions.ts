"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requirePageUpload } from "@/lib/assets/page-access";
import { cloudinaryConfig, CloudinaryNotConfiguredError, signParams } from "@/lib/cloudinary/server";
import { WorkspaceForbiddenError } from "@/lib/workspace/access";
import { importPdf, PdfImportError, pdfFolder, type ImportedPdf } from "./import";

export type PdfUploadTicket = { ok: true; uploadUrl: string; fields: Record<string, string>; uploadId: string };
type Failure = { ok: false; error: string };

const idsSchema = z.object({ organizationId: z.string().min(1), pageId: z.uuid() });

/** Signs the PDF's upload: only PDFs, into the workspace's pdf folder, with this exact id. */
export async function requestPdfUploadAction(
  organizationId: string,
  pageId: string,
): Promise<PdfUploadTicket | Failure> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { ok: false, error: "Página no válida." };

  return guard(async () => {
    const access = await requirePageUpload(ids.data.organizationId, ids.data.pageId);
    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
    const params = {
      allowed_formats: "pdf",
      folder: pdfFolder(access.organizationId),
      public_id: randomUUID(),
      timestamp: Math.floor(Date.now() / 1000),
    };
    return {
      ok: true,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      fields: {
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
        api_key: apiKey,
        signature: signParams(params, apiSecret),
      },
      uploadId: params.public_id,
    };
  });
}

/** Reads the uploaded PDF and returns its blocks; the page inserts them where you were. */
export async function importPdfAction(
  organizationId: string,
  pageId: string,
  uploadId: string,
): Promise<({ ok: true } & ImportedPdf) | Failure> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  const id = z.uuid().safeParse(uploadId);
  if (!ids.success || !id.success) return { ok: false, error: "Importación no válida." };

  return guard(async () => {
    const access = await requirePageUpload(ids.data.organizationId, ids.data.pageId);
    const result = await importPdf(access, ids.data.pageId, id.data);
    return { ok: true, ...result };
  });
}

async function guard<T>(fn: () => Promise<T | Failure>): Promise<T | Failure> {
  try {
    return await fn();
  } catch (error) {
    if (
      error instanceof PdfImportError ||
      error instanceof WorkspaceForbiddenError ||
      error instanceof CloudinaryNotConfiguredError
    ) {
      return { ok: false, error: error.message };
    }
    if (error instanceof Error && error.message.startsWith("Cloudinary")) {
      console.error("[pdf]", error.message);
      return { ok: false, error: "Cloudinary no responde. Vuelve a intentarlo en un momento." };
    }
    throw error; // notFound() for non-members, among others
  }
}
