import "server-only";
import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { member, organization, workspaceSettings } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

export type WorkspaceSummary = Awaited<ReturnType<typeof listMyWorkspaces>>[number];

/** Workspaces the current user belongs to. Never anyone else's. */
export const listMyWorkspaces = cache(async () => {
  const user = await requireUser();
  return db
    .select({
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      accent: workspaceSettings.accentColor,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .innerJoin(workspaceSettings, eq(workspaceSettings.organizationId, organization.id))
    .where(eq(member.userId, user.id))
    .orderBy(asc(organization.name));
});
