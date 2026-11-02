import { createHash, randomBytes } from "node:crypto";

// Shared by signup invites and workspace invite links: the plain token goes
// in the link, only its hash is stored.

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
