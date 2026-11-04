import "server-only";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { page } from "@/db/schema";
import { requireWorkspaceBySlug } from "@/lib/workspace/access";

export type TrashEntry = Awaited<ReturnType<typeof listTrash>>[number];

/**
 * What was deleted, one entry per delete: a page deleted with its sub-pages
 * shares one deletedAt with them, so only the page that was actually deleted
 * is listed, with the number of sub-pages below it.
 */
export async function listTrash(slug: string) {
  const access = await requireWorkspaceBySlug(slug, { page: ["read"] });
  const { rows } = await db.execute<{
    id: string;
    title: string;
    deleted_at: string;
    deleted_by: string | null;
    subpages: number;
  }>(sql`
    select p.id, p.title, p.deleted_at, u.name as deleted_by,
      -- Everything below it: what "delete forever" would also remove.
      (with recursive below as (
          select c.id from page c where c.parent_id = p.id
          union all
          select c.id from page c join below on c.parent_id = below.id
        ) select count(*)::int from below) as subpages
    from page p
    left join page parent on parent.id = p.parent_id
    left join "user" u on u.id = p.updated_by
    where p.organization_id = ${access.organizationId}
      and p.deleted_at is not null
      and (parent.id is null or parent.deleted_at is distinct from p.deleted_at)
    order by p.deleted_at desc
  `);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    deletedAt: new Date(row.deleted_at),
    deletedBy: row.deleted_by,
    subpages: row.subpages,
  }));
}

/** Title of a page in this workspace's trash, or null. */
export async function getTrashedPageTitle(slug: string, pageId: string): Promise<string | null> {
  const access = await requireWorkspaceBySlug(slug, { page: ["read"] });
  const [row] = await db
    .select({ title: page.title })
    .from(page)
    .where(and(eq(page.id, pageId), eq(page.organizationId, access.organizationId), isNotNull(page.deletedAt)))
    .limit(1);
  return row ? row.title : null;
}
