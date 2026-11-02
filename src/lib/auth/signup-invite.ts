import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { signupInvite, user } from "@/db/schema";

export const SIGNUP_COOKIE = "libreta_signup";
export const SIGNUP_INVITE_TTL_DAYS = 7;
// Long enough to fill in the form or go through Google, short enough that a
// forgotten cookie on a shared computer goes stale.
export const SIGNUP_COOKIE_MAX_AGE = 60 * 60;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates an invite and returns the plain token. Only its hash is stored. */
export async function createSignupInvite(input: { note: string | null; createdBy: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SIGNUP_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(signupInvite).values({
    tokenHash: hashToken(token),
    note: input.note,
    expiresAt,
    createdBy: input.createdBy,
  });
  return { token, expiresAt };
}

function usable(tokenHash: string) {
  return and(
    eq(signupInvite.tokenHash, tokenHash),
    isNull(signupInvite.usedAt),
    isNull(signupInvite.revokedAt),
    gt(signupInvite.expiresAt, sql`now()`),
  );
}

/** A usable invite with the name of whoever created it, or null. */
export async function findUsableSignupInvite(token: string) {
  const [row] = await db
    .select({ id: signupInvite.id, inviterName: user.name })
    .from(signupInvite)
    .leftJoin(user, eq(signupInvite.createdBy, user.id))
    .where(usable(hashToken(token)))
    .limit(1);
  return row ?? null;
}

/**
 * Marks the invite as used in a single statement, so two sign-ups racing on
 * the same link can't both succeed. Returns the invite id, or null.
 */
export async function claimSignupInvite(token: string): Promise<string | null> {
  const [row] = await db
    .update(signupInvite)
    .set({ usedAt: sql`now()` })
    .where(usable(hashToken(token)))
    .returning({ id: signupInvite.id });
  return row?.id ?? null;
}

export async function recordSignupInviteUser(token: string, userId: string) {
  await db
    .update(signupInvite)
    .set({ usedBy: userId })
    .where(and(eq(signupInvite.tokenHash, hashToken(token)), isNull(signupInvite.usedBy)));
}
