"use server";

import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { page } from "@/db/schema";
import { requireWorkspaceById, WorkspaceForbiddenError, type WorkspaceAccess } from "@/lib/workspace/access";

export type MovePageResult = { ok: true } | { ok: false; error: string };

const moveSchema = z.object({
  organizationId: z.string().min(1),
  pageId: z.uuid(),
  parentId: z.uuid().nullable(),
  beforeId: z.uuid().nullable(),
});

// Below this gap between neighbours, midpoints stop being exact: renumber the siblings.
const MIN_GAP = 1e-9;

class MoveError extends Error {}

/** Puts a page under `parentId` (null = top level), right before `beforeId` (null = last). */
export async function movePageAction(
  organizationId: string,
  pageId: string,
  parentId: string | null,
  beforeId: string | null,
): Promise<MovePageResult> {
  const input = moveSchema.safeParse({ organizationId, pageId, parentId, beforeId });
  if (!input.success || input.data.beforeId === input.data.pageId) {
    return { ok: false, error: "Ese movimiento no es válido." };
  }

  let access: WorkspaceAccess;
  try {
    access = await requireWorkspaceById(input.data.organizationId, { page: ["update"] });
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error;
  }

  try {
    await db.transaction((tx) => move(tx, access.organizationId, input.data));
  } catch (error) {
    if (error instanceof MoveError) return { ok: false, error: error.message };
    throw error;
  }

  revalidatePath(`/espacio/${access.slug}`, "layout");
  return { ok: true };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function move(tx: Tx, organizationId: string, input: z.infer<typeof moveSchema>) {
  const live = (id: string) => and(eq(page.id, id), eq(page.organizationId, organizationId), isNull(page.deletedAt));

  const [moved] = await tx.select({ id: page.id }).from(page).where(live(input.pageId)).for("update");
  if (!moved) throw new MoveError("Esta página ya no existe.");

  if (input.parentId) {
    const [parent] = await tx.select({ id: page.id }).from(page).where(live(input.parentId));
    if (!parent) throw new MoveError("La página de destino ya no existe.");

    // The new parent can't be the page itself or anything inside it.
    const { rows } = await tx.execute(sql`
      with recursive up as (
        select ${page.id} as id, ${page.parentId} as parent_id from ${page} where ${page.id} = ${input.parentId}
        union all
        select p.id, p.parent_id from ${page} p join up on p.id = up.parent_id
      )
      select 1 from up where id = ${input.pageId} limit 1
    `);
    if (rows.length) throw new MoveError("No puedes meter una página dentro de sí misma.");
  }

  const siblings = await tx
    .select({ id: page.id, position: page.position })
    .from(page)
    .where(
      and(
        eq(page.organizationId, organizationId),
        input.parentId ? eq(page.parentId, input.parentId) : isNull(page.parentId),
        isNull(page.deletedAt),
        ne(page.id, input.pageId),
      ),
    )
    .orderBy(asc(page.position), asc(page.createdAt));

  const index = input.beforeId ? siblings.findIndex((s) => s.id === input.beforeId) : siblings.length;
  if (index < 0) throw new MoveError("La página de destino ya no existe.");

  const prev = siblings[index - 1]?.position;
  const next = siblings[index]?.position;
  let position: number;
  if (prev === undefined) position = next === undefined ? 1 : next - 1;
  else if (next === undefined) position = prev + 1;
  else position = (prev + next) / 2;

  if (prev !== undefined && next !== undefined && next - prev < MIN_GAP) {
    const order = [...siblings.slice(0, index).map((s) => s.id), input.pageId, ...siblings.slice(index).map((s) => s.id)];
    for (const [i, id] of order.entries()) {
      await tx
        .update(page)
        .set(id === input.pageId ? { parentId: input.parentId, position: i + 1 } : { position: i + 1 })
        .where(eq(page.id, id));
    }
    return;
  }

  // Moving isn't editing: updatedAt (and "last edited page") stay as they were.
  await tx.update(page).set({ parentId: input.parentId, position }).where(eq(page.id, input.pageId));
}
