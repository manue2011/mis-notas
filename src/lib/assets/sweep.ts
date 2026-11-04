import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { asset, page } from "@/db/schema";
import { destroyImages } from "@/lib/cloudinary/server";

/**
 * How long an image no page shows any more is kept before it's deleted from
 * Cloudinary: long enough to undo (Ctrl+Z) removing a screenshot.
 */
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * Run after a page's content is saved. Images of the page that it no longer
 * shows are marked; if another page shows them (copied blocks) they're handed
 * over to it; ones still unused after the grace period are deleted.
 * Pages in the trash count as showing their images.
 */
export async function sweepPageAssets(organizationId: string, pageId: string, content: unknown): Promise<void> {
  const text = JSON.stringify(content);
  const images = await db
    .select({ id: asset.id, publicId: asset.cloudinaryPublicId, orphanedAt: asset.orphanedAt })
    .from(asset)
    .where(and(eq(asset.organizationId, organizationId), eq(asset.pageId, pageId)));

  const expired: typeof images = [];
  for (const image of images) {
    if (text.includes(image.publicId)) {
      if (image.orphanedAt) await db.update(asset).set({ orphanedAt: null }).where(eq(asset.id, image.id));
      continue;
    }

    const [shownBy] = await db
      .select({ id: page.id })
      .from(page)
      .where(
        and(
          eq(page.organizationId, organizationId),
          ne(page.id, pageId),
          sql`${page.content}::text like ${`%${image.publicId}%`}`,
        ),
      )
      .limit(1);
    if (shownBy) {
      await db.update(asset).set({ pageId: shownBy.id, orphanedAt: null }).where(eq(asset.id, image.id));
    } else if (!image.orphanedAt) {
      await db.update(asset).set({ orphanedAt: new Date() }).where(eq(asset.id, image.id));
    } else if (Date.now() - image.orphanedAt.getTime() > ORPHAN_GRACE_MS) {
      expired.push(image);
    }
  }
  if (expired.length === 0) return;

  // Cloudinary first: if it fails, the rows stay and the next save retries.
  await destroyImages(expired.map((image) => image.publicId));
  for (const image of expired) await db.delete(asset).where(eq(asset.id, image.id));
}
