"use server";

import { eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { asset, member, organization, user } from "@/db/schema";
import { isSuperadmin, requireUser } from "@/lib/auth/session";
import { destroyImages } from "@/lib/cloudinary/server";

export type DeleteAccountResult = { ok: false; error: string };

class AccountError extends Error {}

const confirmSchema = z.string().trim().toLowerCase().max(320);

/**
 * Deletes your account. Workspaces where you're the only person go with it
 * (pages and images included); in shared ones your pages stay, without your
 * name. If you're a shared workspace's only admin, you must hand that over first.
 */
export async function deleteAccountAction(confirmEmail: string): Promise<DeleteAccountResult> {
  const me = await requireUser();
  const typed = confirmSchema.safeParse(confirmEmail);
  if (!typed.success || typed.data !== me.email.toLowerCase()) {
    return { ok: false, error: "Escribe tu correo tal cual para confirmar." };
  }
  // Nobody else could get into /admin afterwards.
  if (isSuperadmin(me)) {
    return { ok: false, error: "La cuenta de administración de Libreta no se puede eliminar desde aquí." };
  }

  let images: string[];
  try {
    images = await db.transaction(async (tx) => {
      const mine = await tx
        .select({ organizationId: member.organizationId, role: member.role })
        .from(member)
        .where(eq(member.userId, me.id));
      const ids = mine.map((m) => m.organizationId);
      // Locked, so nobody joins or changes roles halfway through.
      const everyone = ids.length
        ? await tx
            .select({ organizationId: member.organizationId, userId: member.userId, role: member.role, name: organization.name })
            .from(member)
            .innerJoin(organization, eq(organization.id, member.organizationId))
            .where(inArray(member.organizationId, ids))
            .for("update", { of: member })
        : [];

      const alone: string[] = [];
      const blocked: string[] = [];
      for (const own of mine) {
        const others = everyone.filter((m) => m.organizationId === own.organizationId && m.userId !== me.id);
        if (others.length === 0) alone.push(own.organizationId);
        else if (own.role === "admin" && !others.some((m) => m.role === "admin")) {
          blocked.push(everyone.find((m) => m.organizationId === own.organizationId)!.name);
        }
      }
      if (blocked.length) {
        const names = blocked.map((n) => `«${n}»`).join(", ");
        throw new AccountError(
          `Eres el único administrador de ${names}. Nombra a otra persona administradora antes de eliminar tu cuenta.`,
        );
      }

      const orphaned = alone.length
        ? await tx.select({ id: asset.cloudinaryPublicId }).from(asset).where(inArray(asset.organizationId, alone))
        : [];
      // Cascades take their pages, images, settings and invite links.
      if (alone.length) await tx.delete(organization).where(inArray(organization.id, alone));
      // Cascades take sessions, sign-in methods and memberships; authorship becomes null.
      await tx.delete(user).where(eq(user.id, me.id));
      return orphaned.map((a) => a.id);
    });
  } catch (error) {
    if (error instanceof AccountError) return { ok: false, error: error.message };
    throw error;
  }

  // The rows are gone, so a failure here only leaves unreachable files behind.
  after(() => destroyImages(images).catch((error) => console.error("[account] image cleanup failed", error)));

  const jar = await cookies();
  for (const { name } of jar.getAll()) {
    if (name.includes("better-auth.")) jar.delete(name);
  }
  redirect("/");
}
