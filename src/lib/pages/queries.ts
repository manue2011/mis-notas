import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { page, user } from "@/db/schema";
import { requireWorkspaceBySlug } from "@/lib/workspace/access";

export type PageSummary = Awaited<ReturnType<typeof listPages>>[number];
export type PageDetail = NonNullable<Awaited<ReturnType<typeof getPage>>>;

const live = (organizationId: string) =>
  and(eq(page.organizationId, organizationId), isNull(page.deletedAt));

/** Live pages of a workspace in tree order (flat; see `buildTree`). */
export const listPages = cache(async (slug: string) => {
  const access = await requireWorkspaceBySlug(slug, { page: ["read"] });
  return db
    .select({ id: page.id, title: page.title, parentId: page.parentId })
    .from(page)
    .where(live(access.organizationId))
    .orderBy(asc(page.position), asc(page.createdAt));
});

export async function getLastEditedPageId(slug: string): Promise<string | null> {
  const access = await requireWorkspaceBySlug(slug, { page: ["read"] });
  const [row] = await db
    .select({ id: page.id })
    .from(page)
    .where(live(access.organizationId))
    .orderBy(desc(page.updatedAt))
    .limit(1);
  return row?.id ?? null;
}

/** A page of the workspace, or null if it doesn't exist there (or was deleted). */
export const getPage = cache(async (slug: string, pageId: string) => {
  const access = await requireWorkspaceBySlug(slug, { page: ["read"] });
  const [row] = await db
    .select({
      id: page.id,
      title: page.title,
      content: page.content,
      updatedAt: page.updatedAt,
      updatedByName: user.name,
    })
    .from(page)
    .leftJoin(user, eq(page.updatedBy, user.id))
    .where(and(eq(page.id, pageId), live(access.organizationId)))
    .limit(1);
  return row ? { ...row, access } : null;
});
