import "server-only";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";

// Talks to Cloudinary's REST API directly (no SDK): signing is a SHA-1 and
// the two admin calls we need are plain fetches.

export const UPLOAD_FORMATS = ["png", "jpg", "jpeg", "webp", "gif"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class CloudinaryNotConfiguredError extends Error {
  constructor() {
    super("Las subidas de imágenes aún no están configuradas.");
  }
}

export function cloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env();
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new CloudinaryNotConfiguredError();
  }
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
}

export function workspaceFolder(organizationId: string): string {
  return `libreta/${organizationId}`;
}

/** Cloudinary's signature: sorted "key=value" pairs joined by "&", plus the secret, SHA-1. */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export type CloudinaryResource = {
  public_id: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  secure_url: string;
};

function adminAuth() {
  const { apiKey, apiSecret, cloudName } = cloudinaryConfig();
  return {
    base: `https://api.cloudinary.com/v1_1/${cloudName}`,
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` },
  };
}

/** The uploaded image as Cloudinary stored it, or null if it doesn't exist. */
export async function fetchImage(publicId: string): Promise<CloudinaryResource | null> {
  const { base, headers } = adminAuth();
  const res = await fetch(`${base}/resources/image/upload/${encodeURI(publicId)}`, {
    headers,
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Cloudinary resource lookup failed: ${res.status}`);
  return (await res.json()) as CloudinaryResource;
}

export async function destroyImage(publicId: string): Promise<void> {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature: signParams({ public_id: publicId, timestamp }, apiSecret),
  });
  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body });
}

const DESTROY_BATCH = 100; // Admin API limit per call

/** Deletes many images (missing ones are fine). Throws if Cloudinary refuses. */
export async function destroyImages(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;
  const { base, headers } = adminAuth();
  for (let i = 0; i < publicIds.length; i += DESTROY_BATCH) {
    const query = new URLSearchParams();
    for (const id of publicIds.slice(i, i + DESTROY_BATCH)) query.append("public_ids[]", id);
    const res = await fetch(`${base}/resources/image/upload?${query}`, { method: "DELETE", headers });
    if (!res.ok) throw new Error(`Cloudinary bulk delete failed: ${res.status}`);
  }
}
