import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { inviteLink, member, organization, user, workspaceSettings } from "@/db/schema";
import type { RoleName } from "@/lib/auth/permissions";
import { hashToken, TOKEN_PATTERN } from "@/lib/tokens";
import { linkProblem } from "./rules";

/**
 * What a workspace invite link points to, for the /unirse page. Anyone
 * holding the link may see the workspace name and who invited them.
 */
export async function findInviteLink(token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;
  const [row] = await db
    .select({
      organizationId: inviteLink.organizationId,
      slug: organization.slug,
      workspaceName: organization.name,
      accent: workspaceSettings.accentColor,
      allowedEmailDomain: workspaceSettings.allowedEmailDomain,
      role: inviteLink.role,
      inviterName: user.name,
      revokedAt: inviteLink.revokedAt,
      expiresAt: inviteLink.expiresAt,
      maxUses: inviteLink.maxUses,
      uses: inviteLink.uses,
    })
    .from(inviteLink)
    .innerJoin(organization, eq(inviteLink.organizationId, organization.id))
    .innerJoin(workspaceSettings, eq(workspaceSettings.organizationId, organization.id))
    .leftJoin(user, eq(inviteLink.createdBy, user.id))
    .where(eq(inviteLink.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return null;
  return { ...row, role: row.role as RoleName, problem: linkProblem(row) };
}

export async function isWorkspaceMember(organizationId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1);
  return Boolean(row);
}
