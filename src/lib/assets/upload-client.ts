import { registerUploadAction, requestUploadAction, type UploadedImage } from "./actions";

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {}

/**
 * Signed upload straight from the browser to Cloudinary (so progress is real
 * and the file never goes through our server), then registered on our side.
 */
export async function uploadImage(
  file: File,
  target: { organizationId: string; pageId: string },
  onProgress: (fraction: number) => void,
): Promise<UploadedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadError("Solo se pueden subir imágenes PNG, JPG, WebP o GIF.");
  }
  if (file.size > MAX_BYTES) throw new UploadError("La imagen pesa más de 10 MB.");

  const ticket = await requestUploadAction(target.organizationId, target.pageId);
  if (!ticket.ok) throw new UploadError(ticket.error);

  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.fields)) form.append(key, value);
  form.append("file", file);
  await postWithProgress(ticket.uploadUrl, form, onProgress);

  const result = await registerUploadAction(target.organizationId, target.pageId, ticket.publicId);
  if (!result.ok) throw new UploadError(result.error);
  return result;
}

function postWithProgress(url: string, body: FormData, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new UploadError("Cloudinary rechazó la imagen. Prueba con otra."));
    xhr.onerror = () => reject(new UploadError("Se cortó la subida. Revisa tu conexión."));
    xhr.send(body);
  });
}
