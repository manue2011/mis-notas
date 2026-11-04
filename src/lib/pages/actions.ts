"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { page } from "@/db/schema";
import { sweepPageAssets } from "@/lib/assets/sweep";
import type { Permissions } from "@/lib/auth/permissions";
import { env } from "@/lib/env";
import { requireWorkspaceById, WorkspaceForbiddenError, type WorkspaceAccess } from "@/lib/workspace/access";
import { extractSearchText, pageContentSchema, pageTitleSchema } from "./content";

export type PageActionResult = { ok: true; savedAt: string } | { ok: false; error: string };

const idsSchema = z.object({ organizationId: z.string().min(1), pageId: z.uuid() });

export async function createPageAction(
  organizationId: string,
  parentId: string | null = null,
): Promise<{ error: string } | void> {
  const input = z
    .object({ organizationId: z.string().min(1), parentId: z.uuid().nullable() })
    .safeParse({ organizationId, parentId });
  if (!input.success) return { error: "Espacio no válido." };

  let access: WorkspaceAccess;
  try {
    access = await requireWorkspaceById(input.data.organizationId, { page: ["create"] });
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { error: error.message };
    throw error;
  }

  const parent = input.data.parentId;
  if (parent) {
    const [row] = await db
      .select({ id: page.id })
      .from(page)
      .where(and(eq(page.id, parent), eq(page.organizationId, access.organizationId), isNull(page.deletedAt)))
      .limit(1);
    if (!row) return { error: "La página de arriba ya no existe." };
  }

  // New pages go to the end of their siblings.
  const siblings = and(
    eq(page.organizationId, access.organizationId),
    parent ? eq(page.parentId, parent) : isNull(page.parentId),
  );
  const [created] = await db
    .insert(page)
    .values({
      organizationId: access.organizationId,
      parentId: parent,
      position: sql`coalesce((select max(${page.position}) from ${page} where ${siblings}), 0) + 1`,
      createdBy: access.userId,
      updatedBy: access.userId,
    })
    .returning({ id: page.id });

  revalidatePath(`/espacio/${access.slug}`, "layout");
  redirect(`/espacio/${access.slug}/p/${created.id}`);
}

export async function savePageTitleAction(
  organizationId: string,
  pageId: string,
  title: string,
): Promise<PageActionResult> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  const parsed = pageTitleSchema.safeParse(title);
  if (!ids.success || !parsed.success) return { ok: false, error: "El título no es válido." };

  return updatePage(ids.data, { page: ["update"] }, { title: parsed.data }, true);
}

export async function savePageContentAction(
  organizationId: string,
  pageId: string,
  content: unknown,
): Promise<PageActionResult> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { ok: false, error: "Página no válida." };
  const parsed = pageContentSchema({
    organizationId: ids.data.organizationId,
    cloudName: env().CLOUDINARY_CLOUD_NAME,
  }).safeParse(content);
  if (!parsed.success) {
    // Only our own (custom) messages are worded for people; zod's aren't.
    const custom = parsed.error.issues.find((issue) => issue.code === "custom");
    return { ok: false, error: custom?.message ?? "El contenido no es válido." };
  }

  const result = await updatePage(
    ids.data,
    { page: ["update"] },
    { content: parsed.data, searchText: extractSearchText(parsed.data) },
    false,
  );
  if (result.ok) {
    // Tidy up images the page stopped showing, without slowing the save down.
    after(() =>
      sweepPageAssets(ids.data.organizationId, ids.data.pageId, parsed.data).catch((error) =>
        console.error("[assets] sweep failed:", error instanceof Error ? error.message : error),
      ),
    );
  }
  return result;
}

export async function deletePageAction(organizationId: string, pageId: string): Promise<{ error: string } | void> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { error: "Página no válida." };

  let access: WorkspaceAccess;
  try {
    access = await requireWorkspaceById(ids.data.organizationId, { page: ["delete"] });
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { error: error.message };
    throw error;
  }

  // The page and all its sub-pages go together, stamped with the same time so
  // they can be restored together later.
  const deletedAt = new Date();
  const result = await db.execute(sql`
    with recursive subtree as (
      select ${page.id} as id from ${page}
      where ${page.id} = ${ids.data.pageId}
        and ${page.organizationId} = ${access.organizationId}
        and ${page.deletedAt} is null
      union all
      select child.id from ${page} child
      join subtree on child.parent_id = subtree.id
      where child.deleted_at is null
    )
    update ${page}
    set deleted_at = ${deletedAt}, updated_by = ${access.userId}, updated_at = ${deletedAt}
    where ${page.id} in (select id from subtree)
  `);
  if (!result.rowCount) return { error: "Esta página ya no existe." };

  revalidatePath(`/espacio/${access.slug}`, "layout");
  redirect(`/espacio/${access.slug}`);
}

async function updatePage(
  ids: z.infer<typeof idsSchema>,
  permissions: Permissions,
  values: Partial<typeof page.$inferInsert>,
  refreshSidebar: boolean,
): Promise<PageActionResult> {
  let access: WorkspaceAccess;
  try {
    access = await requireWorkspaceById(ids.organizationId, permissions);
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error;
  }

  const savedAt = new Date();
  const [updated] = await db
    .update(page)
    .set({ ...values, updatedBy: access.userId, updatedAt: savedAt })
    .where(
      and(
        eq(page.id, ids.pageId),
        eq(page.organizationId, access.organizationId),
        isNull(page.deletedAt),
      ),
    )
    .returning({ id: page.id });
  if (!updated) return { ok: false, error: "Esta página ya no existe." };

  if (refreshSidebar) revalidatePath(`/espacio/${access.slug}`, "layout");
  return { ok: true, savedAt: savedAt.toISOString() };
}
