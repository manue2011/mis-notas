import "server-only";
import { and, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { asset, page } from "@/db/schema";
import { destroyImages } from "@/lib/cloudinary/server";

export class PurgeImagesError extends Error {
  constructor() {
    super("No hemos podido borrar sus imágenes. Vuelve a intentarlo en un momento.");
  }
}

/**
 * Deletes pages from the trash for good, with everything inside them and
 * their images in Cloudinary. `roots` picks which trashed pages (on top of
 * being in the trash). Images that another page outside them still shows
 * (blocks copied across pages) are kept and handed over to that page.
 * Returns how many trashed pages matched.
 */
export async function purgeTrashedPages(organizationId: string, roots?: SQL): Promise<number> {
  const where = and(eq(page.organizationId, organizationId), isNotNull(page.deletedAt), roots);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(page).where(where);
  if (count === 0) return 0;

  // Every image under them, and a page outside them that still shows it.
  const { rows: images } = await db.execute<{ id: string; public_id: string; kept_by: string | null }>(sql`
    with recursive subtree as (
      select ${page.id} as id from ${page} where ${where}
      union
      select child.id from ${page} child join subtree on child.parent_id = subtree.id
    )
    select a.id, a.cloudinary_public_id as public_id,
      (select p.id from ${page} p
        where p.organization_id = ${organizationId}
          and p.id not in (select id from subtree)
          and p.content::text like '%' || a.cloudinary_public_id || '%'
        limit 1) as kept_by
    from ${asset} a
    where a.organization_id = ${organizationId}
      and a.page_id in (select id from subtree)
  `);

  // Cloudinary first: if it fails, nothing is deleted and it can be retried.
  try {
    await destroyImages(images.filter((image) => !image.kept_by).map((image) => image.public_id));
  } catch (error) {
    console.error("[trash]", error instanceof Error ? error.message : error);
    throw new PurgeImagesError();
  }

  await db.transaction(async (tx) => {
    for (const image of images) {
      if (image.kept_by) await tx.update(asset).set({ pageId: image.kept_by }).where(eq(asset.id, image.id));
    }
    // Sub-pages and the remaining asset rows go with them (on delete cascade).
    await tx.delete(page).where(where);
  });
  return count;
}
