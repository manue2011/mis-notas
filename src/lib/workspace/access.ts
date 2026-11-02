import "server-only";
import { and, eq, type SQL } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { member, organization, workspaceSettings } from "@/db/schema";
import type { AccentKey } from "@/lib/accent";
import { requireUser } from "@/lib/auth/session";
import { roles, type Permissions, type RoleName } from "@/lib/auth/permissions";

export type WorkspaceAccess = {
  organizationId: string;
  slug: string;
  name: string;
  accent: AccentKey;
  role: RoleName;
  userId: string;
};

export class WorkspaceForbiddenError extends Error {
  constructor() {
    super("Tu rol en este espacio no permite hacer esto.");
  }
}

function isRoleName(role: string): role is RoleName {
  return role in roles;
}

export function can(role: RoleName, permissions: Permissions): boolean {
  return roles[role].authorize(permissions).success;
}

async function findAccess(userId: string, where: SQL): Promise<WorkspaceAccess | null> {
  const [row] = await db
    .select({
      organizationId: organization.id,
      slug: organization.slug,
      name: organization.name,
      accent: workspaceSettings.accentColor,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .innerJoin(workspaceSettings, eq(workspaceSettings.organizationId, organization.id))
    .where(and(eq(member.userId, userId), where))
    .limit(1);
  if (!row || !isRoleName(row.role)) return null;
  return { ...row, role: row.role, userId };
}

/** The current user's access to a workspace, or null if they aren't a member. */
export const getWorkspaceAccessBySlug = cache(async (slug: string) => {
  const user = await requireUser();
  return findAccess(user.id, eq(organization.slug, slug));
});

/**
 * Every read and write of a workspace's data goes through one of these.
 * Non-members get a 404 so they can't tell whether the workspace exists.
 */
export async function requireWorkspaceBySlug(slug: string, permissions?: Permissions) {
  const access = await getWorkspaceAccessBySlug(slug);
  return authorize(access, permissions);
}

export async function requireWorkspaceById(organizationId: string, permissions?: Permissions) {
  const user = await requireUser();
  const access = await findAccess(user.id, eq(organization.id, organizationId));
  return authorize(access, permissions);
}

function authorize(access: WorkspaceAccess | null, permissions?: Permissions) {
  if (!access) notFound();
  if (permissions && !can(access.role, permissions)) throw new WorkspaceForbiddenError();
  return access;
}
