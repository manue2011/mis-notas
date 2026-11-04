"use server";

import { and, eq, inArray, isNotNull, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { asset, page } from "@/db/schema";
import { destroyImages } from "@/lib/cloudinary/server";
import { requireWorkspaceById, WorkspaceForbiddenError, type WorkspaceAccess } from "@/lib/workspace/access";

export type TrashActionResult = { ok: true } | { ok: false; error: string };

const idsSchema = z.object({ organizationId: z.string().min(1), pageId: z.uuid() });

const NOT_IN_TRASH = "Esta página ya no está en la papelera.";

/**
 * Brings back a page and the sub-pages deleted with it. If the page it lived
 * in is itself deleted (or gone), it comes back at the top level.
 */
export async function restorePageAction(organizationId: string, pageId: string): Promise<TrashActionResult> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { ok: false, error: "Página no válida." };
  const access = await authorize(ids.data.organizationId);
  if (!("organizationId" in access)) return access;

  const restored = await db.transaction(async (tx) => {
    const [root] = await tx
      .select({ id: page.id, parentId: page.parentId, deletedAt: page.deletedAt })
      .from(page)
      .where(inTrash(access.organizationId, ids.data.pageId))
      .for("update");
    if (!root?.deletedAt) return false;

    if (root.parentId) {
      const [parent] = await tx
        .select({ deletedAt: page.deletedAt })
        .from(page)
        .where(eq(page.id, root.parentId))
        .limit(1);
      if (!parent || parent.deletedAt) {
        await tx
          .update(page)
          .set({
            parentId: null,
            position: sql`coalesce((select max(${page.position}) from ${page}
              where ${page.organizationId} = ${access.organizationId} and ${page.parentId} is null), 0) + 1`,
          })
          .where(eq(page.id, root.id));
      }
    }

    // Only what went in with this delete: sub-pages deleted earlier on their
    // own keep their own entry in the trash.
    await tx.execute(sql`
      with recursive subtree as (
        select ${root.id}::uuid as id
        union all
        select child.id from ${page} child
        join subtree on child.parent_id = subtree.id
        where child.deleted_at = ${root.deletedAt}
      )
      update ${page} set deleted_at = null
      where ${page.id} in (select id from subtree)
    `);
    return true;
  });
  if (!restored) return { ok: false, error: NOT_IN_TRASH };

  revalidatePath(`/espacio/${access.slug}`, "layout");
  redirect(`/espacio/${access.slug}/p/${ids.data.pageId}`);
}

/**
 * Deletes a page from the trash for good, with everything inside it and its
 * images in Cloudinary. Images that another page still shows (blocks copied
 * across pages) are kept and handed over to that page.
 */
export async function deletePageForeverAction(organizationId: string, pageId: string): Promise<TrashActionResult> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { ok: false, error: "Página no válida." };
  const access = await authorize(ids.data.organizationId);
  if (!("organizationId" in access)) return access;

  const [root] = await db
    .select({ id: page.id })
    .from(page)
    .where(inTrash(access.organizationId, ids.data.pageId))
    .limit(1);
  if (!root) return { ok: false, error: NOT_IN_TRASH };

  const { rows: subtree } = await db.execute<{ id: string }>(sql`
    with recursive subtree as (
      select ${root.id}::uuid as id
      union all
      select child.id from ${page} child join subtree on child.parent_id = subtree.id
    )
    select id from subtree
  `);
  const pageIds = subtree.map((row) => row.id);

  const images = await db
    .select({ id: asset.id, publicId: asset.cloudinaryPublicId })
    .from(asset)
    .where(and(eq(asset.organizationId, access.organizationId), inArray(asset.pageId, pageIds)));

  // For each image, another page (outside what's being deleted) that still shows it.
  const keptBy = new Map<string, string>();
  for (const image of images) {
    const [user] = await db
      .select({ id: page.id })
      .from(page)
      .where(
        and(
          eq(page.organizationId, access.organizationId),
          notInArray(page.id, pageIds),
          sql`${page.content}::text like ${`%${image.publicId}%`}`,
        ),
      )
      .limit(1);
    if (user) keptBy.set(image.id, user.id);
  }

  // Cloudinary first: if it fails, nothing is deleted and it can be retried.
  try {
    await destroyImages(images.filter((image) => !keptBy.has(image.id)).map((image) => image.publicId));
  } catch (error) {
    console.error("[trash]", error instanceof Error ? error.message : error);
    return { ok: false, error: "No hemos podido borrar sus imágenes. Vuelve a intentarlo en un momento." };
  }

  await db.transaction(async (tx) => {
    for (const [assetId, newPageId] of keptBy) {
      await tx.update(asset).set({ pageId: newPageId }).where(eq(asset.id, assetId));
    }
    // Sub-pages and the remaining asset rows go with it (on delete cascade).
    await tx.delete(page).where(inTrash(access.organizationId, root.id));
  });

  revalidatePath(`/espacio/${access.slug}`, "layout");
  return { ok: true };
}

function inTrash(organizationId: string, pageId: string) {
  return and(eq(page.id, pageId), eq(page.organizationId, organizationId), isNotNull(page.deletedAt));
}

async function authorize(organizationId: string): Promise<WorkspaceAccess | { ok: false; error: string }> {
  try {
    return await requireWorkspaceById(organizationId, { page: ["delete"] });
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error;
  }
}
