"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { page, user } from "@/db/schema";
import { requireWorkspaceById } from "@/lib/workspace/access";

export type PagePreview = {
  title: string;
  /** The start of the page's text. */
  excerpt: string;
  updatedAt: string;
  updatedByName: string | null;
};

const EXCERPT_LENGTH = 280;

/** What the hover card over a link to another page shows; null if it's gone. */
export async function getPagePreviewAction(organizationId: string, pageId: string): Promise<PagePreview | null> {
  const input = z.object({ organizationId: z.string().min(1), pageId: z.uuid() }).safeParse({ organizationId, pageId });
  if (!input.success) return null;

  const access = await requireWorkspaceById(input.data.organizationId, { page: ["read"] });
  const [row] = await db
    .select({
      title: page.title,
      excerpt: sql<string>`left(${page.searchText}, ${EXCERPT_LENGTH})`,
      updatedAt: page.updatedAt,
      updatedByName: user.name,
    })
    .from(page)
    .leftJoin(user, eq(page.updatedBy, user.id))
    .where(and(eq(page.id, input.data.pageId), eq(page.organizationId, access.organizationId), isNull(page.deletedAt)))
    .limit(1);
  return row ? { ...row, updatedAt: row.updatedAt.toISOString() } : null;
}
