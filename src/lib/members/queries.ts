import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { member, user } from "@/db/schema";

export type MemberRow = Awaited<ReturnType<typeof listMembers>>[number];

/**
 * Members of a workspace, admins first. Callers must have checked the user
 * may manage the workspace.
 */
export async function listMembers(organizationId: string) {
  return db
    .select({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.createdAt,
      name: user.name,
      email: user.email,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId))
    .orderBy(sql`case ${member.role} when 'admin' then 0 when 'editor' then 1 else 2 end`, asc(user.name));
}
