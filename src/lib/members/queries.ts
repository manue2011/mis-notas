import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { member, memberPageScope, user } from "@/db/schema";

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
      /** The pages they may see; null for the whole workspace. */
      pageIds: memberPageScope.pageIds,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .leftJoin(memberPageScope, eq(memberPageScope.memberId, member.id))
    .where(eq(member.organizationId, organizationId))
    .orderBy(sql`case ${member.role} when 'admin' then 0 when 'editor' then 1 else 2 end`, asc(user.name));
}

/** How many people are in a workspace. Callers must have checked access. */
export async function countMembers(organizationId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(member)
    .where(eq(member.organizationId, organizationId));
  return row?.count ?? 0;
}
