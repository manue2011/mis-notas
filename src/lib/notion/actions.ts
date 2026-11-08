"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { page } from "@/db/schema";
import { pageTitleSchema } from "@/lib/pages/content";
import { requireWorkspaceById, WorkspaceForbiddenError } from "@/lib/workspace/access";

export type CreatedPages = { ok: true; ids: string[] } | { ok: false; error: string };

/** Per call: the importer sends a big export in batches, parents before children. */
const MAX_PAGES_PER_CALL = 100;

const inputSchema = z.object({
  organizationId: z.string().min(1),
  pages: z
    .array(z.object({ title: pageTitleSchema, parentId: z.uuid().nullable() }))
    .min(1)
    .max(MAX_PAGES_PER_CALL),
});

/**
 * Creates empty pages for an import, in the given order, at the end of
 * their parent's subpages. Their content is saved afterwards like any edit.
 */
export async function createImportedPagesAction(
  organizationId: string,
  pages: { title: string; parentId: string | null }[],
): Promise<CreatedPages> {
  const input = inputSchema.safeParse({ organizationId, pages });
  if (!input.success) return { ok: false, error: "Datos de importación no válidos." };

  let access;
  try {
    access = await requireWorkspaceById(input.data.organizationId, { page: ["create"] });
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error;
  }
  const { organizationId: orgId, userId } = access;

  const parents = [...new Set(input.data.pages.map((p) => p.parentId).filter((id): id is string => id !== null))];
  if (parents.length) {
    const found = await db
      .select({ id: page.id })
      .from(page)
      .where(and(eq(page.organizationId, orgId), inArray(page.id, parents), isNull(page.deletedAt)));
    if (found.length !== parents.length) return { ok: false, error: "Una de las páginas de arriba ya no existe." };
  }

  const ids = await db.transaction(async (tx) => {
    // Where each parent's subpages currently end, so new ones go after them.
    const next = new Map<string | null, number>();
    const startFor = async (parentId: string | null) => {
      if (!next.has(parentId)) {
        const [row] = await tx
          .select({ max: sql<number>`coalesce(max(${page.position}), 0)` })
          .from(page)
          .where(and(eq(page.organizationId, orgId), parentId ? eq(page.parentId, parentId) : isNull(page.parentId)));
        next.set(parentId, Number(row.max) + 1);
      }
      const position = next.get(parentId)!;
      next.set(parentId, position + 1);
      return position;
    };

    const values = [];
    for (const item of input.data.pages) {
      values.push({
        id: randomUUID(),
        organizationId: orgId,
        parentId: item.parentId,
        title: item.title,
        position: await startFor(item.parentId),
        createdBy: userId,
        updatedBy: userId,
      });
    }
    // Ids chosen here, so they match the input order whatever the database returns.
    await tx.insert(page).values(values);
    return values.map((value) => value.id);
  });

  revalidatePath(`/espacio/${access.slug}`, "layout");
  return { ok: true, ids };
}
