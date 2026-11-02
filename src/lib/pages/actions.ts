"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { page } from "@/db/schema";
import type { Permissions } from "@/lib/auth/permissions";
import { env } from "@/lib/env";
import { requireWorkspaceById, WorkspaceForbiddenError, type WorkspaceAccess } from "@/lib/workspace/access";
import { pageContentSchema, pageTitleSchema } from "./content";

export type PageActionResult = { ok: true; savedAt: string } | { ok: false; error: string };

const idsSchema = z.object({ organizationId: z.string().min(1), pageId: z.uuid() });

export async function createPageAction(organizationId: string): Promise<{ error: string } | void> {
  const id = z.string().min(1).safeParse(organizationId);
  if (!id.success) return { error: "Espacio no válido." };

  let access: WorkspaceAccess;
  try {
    access = await requireWorkspaceById(id.data, { page: ["create"] });
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { error: error.message };
    throw error;
  }

  // New pages go to the end of the list.
  const [created] = await db
    .insert(page)
    .values({
      organizationId: access.organizationId,
      position: sql`coalesce((select max(${page.position}) from ${page} where ${page.organizationId} = ${access.organizationId}), 0) + 1`,
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

  return updatePage(ids.data, { page: ["update"] }, { content: parsed.data }, false);
}

export async function deletePageAction(organizationId: string, pageId: string): Promise<{ error: string } | void> {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { error: "Página no válida." };

  const result = await updatePage(ids.data, { page: ["delete"] }, { deletedAt: new Date() }, true);
  if (!result.ok) return { error: result.error };
  const access = await requireWorkspaceById(ids.data.organizationId);
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
