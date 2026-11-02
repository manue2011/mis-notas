import "server-only";
import { and, asc, desc, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { signupInvite, user } from "@/db/schema";
import { requireSuperadmin } from "@/lib/auth/session";

export type AdminUser = Awaited<ReturnType<typeof listUsers>>[number];
export type PendingInvite = Awaited<ReturnType<typeof listPendingInvites>>[number];

export async function listUsers() {
  await requireSuperadmin();
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.name));
}

export async function listPendingInvites() {
  await requireSuperadmin();
  return db
    .select({
      id: signupInvite.id,
      note: signupInvite.note,
      expiresAt: signupInvite.expiresAt,
      createdAt: signupInvite.createdAt,
    })
    .from(signupInvite)
    .where(
      and(
        isNull(signupInvite.usedAt),
        isNull(signupInvite.revokedAt),
        gt(signupInvite.expiresAt, sql`now()`),
      ),
    )
    .orderBy(desc(signupInvite.createdAt));
}
