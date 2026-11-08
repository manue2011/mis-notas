"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import { asset } from "@/db/schema";
import {
  cloudinaryConfig,
  CloudinaryNotConfiguredError,
  destroyImage,
  fetchImage,
  MAX_UPLOAD_BYTES,
  signParams,
  UPLOAD_FORMATS,
  workspaceFolder,
} from "@/lib/cloudinary/server";
import { WorkspaceForbiddenError } from "@/lib/workspace/access";
import { requirePageUpload } from "./page-access";

export type UploadTicket = {
  ok: true;
  uploadUrl: string;
  fields: Record<string, string>;
  publicId: string;
};
export type UploadedImage = { ok: true; assetId: string; url: string; width: number; height: number };
type Failure = { ok: false; error: string };

const idsSchema = z.object({ organizationId: z.string().min(1), pageId: z.uuid() });

/**
 * Signs one upload. The signature pins the folder, the exact public id, the
 * allowed formats and the WebP conversion, so the browser can't change them.
 * Cloudinary's free plan caps images at 10 MB, and registration checks it again.
 */
export async function requestUploadAction(organizationId: string, pageId: string): Promise<UploadTicket | Failure> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { ok: false, error: "Página no válida." };

  return guard(async () => {
    const access = await requirePageUpload(ids.data.organizationId, ids.data.pageId);
    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();

    const params = {
      allowed_formats: UPLOAD_FORMATS.join(","),
      folder: workspaceFolder(access.organizationId),
      public_id: randomUUID(),
      timestamp: Math.floor(Date.now() / 1000),
      // An incoming transformation, not `format`: Cloudinary ignores `format`
      // when `allowed_formats` is also set.
      transformation: "f_webp",
    };
    return {
      ok: true,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      fields: {
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
        api_key: apiKey,
        signature: signParams(params, apiSecret),
      },
      publicId: params.public_id,
    };
  });
}

/**
 * Called after the browser finishes uploading. Checks with Cloudinary what was
 * actually stored (folder, format, size) before recording it; anything off
 * is deleted from Cloudinary.
 */
export async function registerUploadAction(
  organizationId: string,
  pageId: string,
  publicId: string,
): Promise<UploadedImage | Failure> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  const id = z.uuid().safeParse(publicId);
  if (!ids.success || !id.success) return { ok: false, error: "Subida no válida." };

  return guard(async () => {
    const access = await requirePageUpload(ids.data.organizationId, ids.data.pageId);
    const fullId = `${workspaceFolder(access.organizationId)}/${id.data}`;

    const image = await fetchImage(fullId);
    if (!image) return { ok: false, error: "No encontramos la imagen subida. Vuelve a intentarlo." };
    if (image.format !== "webp" || image.bytes > MAX_UPLOAD_BYTES) {
      await destroyImage(fullId);
      return { ok: false, error: "La imagen no cumple los requisitos (máximo 10 MB)." };
    }

    const [row] = await db
      .insert(asset)
      .values({
        organizationId: access.organizationId,
        pageId: ids.data.pageId,
        cloudinaryPublicId: fullId,
        url: image.secure_url,
        width: image.width,
        height: image.height,
        bytes: image.bytes,
        uploadedBy: access.userId,
      })
      .onConflictDoNothing({ target: asset.cloudinaryPublicId })
      .returning({ id: asset.id });
    if (!row) return { ok: false, error: "Esta imagen ya estaba registrada." };

    return { ok: true, assetId: row.id, url: image.secure_url, width: image.width, height: image.height };
  });
}

async function guard<T>(fn: () => Promise<T | Failure>): Promise<T | Failure> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError || error instanceof CloudinaryNotConfiguredError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof Error && error.message.startsWith("Cloudinary")) {
      console.error("[assets]", error.message);
      return { ok: false, error: "Cloudinary no responde. Vuelve a intentarlo en un momento." };
    }
    throw error; // notFound() for non-members, among others
  }
}
