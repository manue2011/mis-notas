import { postWithProgress } from "@/lib/assets/upload-client";
import { importPdfAction, requestPdfUploadAction } from "./actions";
import type { ImportedPdf } from "./import";

const MAX_BYTES = 10 * 1024 * 1024;

export class PdfImportClientError extends Error {}

type Target = { organizationId: string; pageId: string };

/** Uploads the PDF straight to Cloudinary (signed), then has the server turn it into blocks. */
export async function importPdfFile(
  file: File,
  target: Target,
  onStep: (step: { phase: "uploading"; progress: number } | { phase: "reading" }) => void,
): Promise<ImportedPdf> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new PdfImportClientError("Elige un archivo PDF.");
  }
  if (file.size > MAX_BYTES) throw new PdfImportClientError("El PDF pesa más de 10 MB.");

  const ticket = await requestPdfUploadAction(target.organizationId, target.pageId);
  if (!ticket.ok) throw new PdfImportClientError(ticket.error);

  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.fields)) form.append(key, value);
  form.append("file", file);
  onStep({ phase: "uploading", progress: 0 });
  await postWithProgress(ticket.uploadUrl, form, (progress) => onStep({ phase: "uploading", progress })).catch(
    () => {
      throw new PdfImportClientError("No se ha podido subir el PDF. Revisa tu conexión.");
    },
  );

  onStep({ phase: "reading" });
  const result = await importPdfAction(target.organizationId, target.pageId, ticket.uploadId);
  if (!result.ok) throw new PdfImportClientError(result.error);
  return result;
}
