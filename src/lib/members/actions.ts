"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { member } from "@/db/schema";
import { ROLE_NAMES } from "@/lib/auth/permissions";
import { requireWorkspaceById, WorkspaceForbiddenError, type WorkspaceAccess } from "@/lib/workspace/access";

export type MemberActionResult = { ok: true } | { ok: false; error: string };

const LAST_ADMIN = "Tiene que quedar al menos un administrador en el espacio.";

class MemberError extends Error {}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * The member, locked, plus whether someone else is admin. Admin rows are
 * locked too, so two admins can't demote each other at the same moment.
 */
async function lockMember(tx: Tx, organizationId: string, memberId: string) {
  const [target] = await tx
    .select({ id: member.id, userId: member.userId, role: member.role })
    .from(member)
    .where(and(eq(member.id, memberId), eq(member.organizationId, organizationId)))
    .for("update");
  if (!target) throw new MemberError("Esta persona ya no está en el espacio.");
  const otherAdmins = await tx
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.role, "admin"), ne(member.id, memberId)))
    .for("update");
  return { target, hasOtherAdmin: otherAdmins.length > 0 };
}

export async function changeMemberRoleAction(
  organizationId: string,
  memberId: string,
  role: string,
): Promise<MemberActionResult> {
  const input = z
    .object({ organizationId: z.string().min(1), memberId: z.string().min(1), role: z.enum(ROLE_NAMES) })
    .safeParse({ organizationId, memberId, role });
  if (!input.success) return { ok: false, error: "Rol no válido." };

  return run(input.data.organizationId, async (access) => {
    let demotedSelf = false;
    await db.transaction(async (tx) => {
      const { target, hasOtherAdmin } = await lockMember(tx, access.organizationId, input.data.memberId);
      if (target.role === "admin" && input.data.role !== "admin" && !hasOtherAdmin) throw new MemberError(LAST_ADMIN);
      await tx.update(member).set({ role: input.data.role }).where(eq(member.id, target.id));
      demotedSelf = target.userId === access.userId && input.data.role !== "admin";
    });
    // Without admin rights the settings screen is gone for them.
    return demotedSelf ? `/espacio/${access.slug}` : undefined;
  });
}

export async function removeMemberAction(organizationId: string, memberId: string): Promise<MemberActionResult> {
  const input = z
    .object({ organizationId: z.string().min(1), memberId: z.string().min(1) })
    .safeParse({ organizationId, memberId });
  if (!input.success) return { ok: false, error: "Persona no válida." };

  return run(input.data.organizationId, async (access) => {
    await db.transaction(async (tx) => {
      const { target, hasOtherAdmin } = await lockMember(tx, access.organizationId, input.data.memberId);
      if (target.userId === access.userId) throw new MemberError("Para irte tú, usa «Salir del espacio».");
      if (target.role === "admin" && !hasOtherAdmin) throw new MemberError(LAST_ADMIN);
      await tx.delete(member).where(eq(member.id, target.id));
    });
  });
}

/** Any member can leave, as long as the workspace keeps an admin. */
export async function leaveWorkspaceAction(organizationId: string): Promise<MemberActionResult> {
  const id = z.string().min(1).safeParse(organizationId);
  if (!id.success) return { ok: false, error: "Espacio no válido." };

  let access: WorkspaceAccess;
  try {
    access = await requireWorkspaceById(id.data);
    await db.transaction(async (tx) => {
      const [own] = await tx
        .select({ id: member.id })
        .from(member)
        .where(and(eq(member.organizationId, access.organizationId), eq(member.userId, access.userId)))
        .limit(1);
      if (!own) return;
      const { target, hasOtherAdmin } = await lockMember(tx, access.organizationId, own.id);
      if (target.role === "admin" && !hasOtherAdmin) {
        throw new MemberError("Eres el único administrador: nombra a otra persona administradora antes de irte.");
      }
      await tx.delete(member).where(eq(member.id, target.id));
    });
  } catch (error) {
    if (error instanceof MemberError) return { ok: false, error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  redirect("/libretas");
}

async function run(
  organizationId: string,
  /** May return where to send the person afterwards. */
  fn: (access: WorkspaceAccess) => Promise<string | void>,
): Promise<MemberActionResult> {
  let access: WorkspaceAccess;
  let next: string | void;
  try {
    access = await requireWorkspaceById(organizationId, { settings: ["update"] });
    next = await fn(access);
  } catch (error) {
    if (error instanceof MemberError || error instanceof WorkspaceForbiddenError) {
      return { ok: false, error: error.message };
    }
    throw error; // notFound() among them
  }
  revalidatePath(`/espacio/${access.slug}`, "layout");
  if (next) redirect(next);
  return { ok: true };
}
