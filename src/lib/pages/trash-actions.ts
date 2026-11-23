"use server";

import { and, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { page } from "@/db/schema";
import { purgeTrashedPages, PurgeImagesError } from "./purge";
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
 * images in Cloudinary (see purgeTrashedPages).
 */
export async function deletePageForeverAction(organizationId: string, pageId: string): Promise<TrashActionResult> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { ok: false, error: "Página no válida." };
  const access = await authorize(ids.data.organizationId);
  if (!("organizationId" in access)) return access;

  return purge(access, eq(page.id, ids.data.pageId), NOT_IN_TRASH);
}

/** Deletes everything in the trash for good, images included. */
export async function emptyTrashAction(organizationId: string): Promise<TrashActionResult> {
  const id = z.string().min(1).safeParse(organizationId);
  if (!id.success) return { ok: false, error: "Espacio no válido." };
  const access = await authorize(id.data);
  if (!("organizationId" in access)) return access;

  return purge(access, undefined, "La papelera ya está vacía.");
}

async function purge(access: WorkspaceAccess, roots: SQL | undefined, nothingLeft: string): Promise<TrashActionResult> {
  let deleted: number;
  try {
    deleted = await purgeTrashedPages(access.organizationId, roots);
  } catch (error) {
    if (error instanceof PurgeImagesError) return { ok: false, error: error.message };
    throw error;
  }
  if (deleted === 0) return { ok: false, error: nothingLeft };
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
