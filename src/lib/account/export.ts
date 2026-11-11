import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { account, aiUsage, asset, member, organization, page, session, user } from "@/db/schema";

// "Descargar mis datos" (GDPR access and portability): everything Libreta
// keeps about one person, as plain JSON. Secrets (password hash, tokens)
// stay out: they're not useful to anyone and only a risk in a download.

export async function exportUserData(userId: string) {
  const [me] = await db
    .select({ id: user.id, name: user.name, email: user.email, image: user.image, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId));
  if (!me) return null;

  const [signIns, memberships, sessions, aiUses] = await Promise.all([
    db.select({ provider: account.providerId, createdAt: account.createdAt }).from(account).where(eq(account.userId, userId)),
    db
      .select({ organizationId: member.organizationId, workspace: organization.name, role: member.role, joinedAt: member.createdAt })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, userId)),
    db
      .select({ startedAt: session.createdAt, expiresAt: session.expiresAt, ipAddress: session.ipAddress, userAgent: session.userAgent })
      .from(session)
      .where(eq(session.userId, userId)),
    db.select({ day: aiUsage.day, uses: aiUsage.uses }).from(aiUsage).where(eq(aiUsage.userId, userId)),
  ]);

  // Only what's in workspaces you're still part of: the rest isn't yours to take.
  const workspaceIds = memberships.map((m) => m.organizationId);
  const [pages, images] = workspaceIds.length
    ? await Promise.all([
        db
          .select({
            id: page.id,
            organizationId: page.organizationId,
            parentId: page.parentId,
            title: page.title,
            content: page.content,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
            inTrashSince: page.deletedAt,
          })
          .from(page)
          .where(and(eq(page.createdBy, userId), inArray(page.organizationId, workspaceIds))),
        db
          .select({ organizationId: asset.organizationId, pageId: asset.pageId, url: asset.url, uploadedAt: asset.createdAt })
          .from(asset)
          .where(and(eq(asset.uploadedBy, userId), inArray(asset.organizationId, workspaceIds))),
      ])
    : [[], []];

  return {
    exportedAt: new Date().toISOString(),
    account: { ...me, signInMethods: signIns },
    workspaces: memberships,
    pagesYouCreated: pages,
    imagesYouUploaded: images,
    activeSessions: sessions,
    aiTidyUsesPerDay: aiUses,
  };
}
