"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { signupInvite } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { requireSuperadmin } from "@/lib/auth/session";
import { createSignupInvite } from "@/lib/auth/signup-invite";
import { env } from "@/lib/env";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
export type CreateInviteResult = { url: string; expiresAt: string } | { error: string } | null;

const noteSchema = z
  .string()
  .trim()
  .max(80)
  .transform((v) => v || null);

export async function createInviteAction(
  _prev: CreateInviteResult,
  formData: FormData,
): Promise<CreateInviteResult> {
  const admin = await requireSuperadmin();
  const note = noteSchema.safeParse(formData.get("note") ?? "");
  if (!note.success) return { error: "La nota puede tener como mucho 80 caracteres." };

  const { token, expiresAt } = await createSignupInvite({ note: note.data, createdBy: admin.id });
  revalidatePath("/admin");
  return {
    url: new URL(`/invitacion/${token}`, env().BETTER_AUTH_URL).toString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function revokeInviteAction(inviteId: string): Promise<ActionResult> {
  await requireSuperadmin();
  const id = z.uuid().safeParse(inviteId);
  if (!id.success) return { ok: false, error: "Enlace no válido." };

  await db
    .update(signupInvite)
    .set({ revokedAt: new Date() })
    .where(and(eq(signupInvite.id, id.data), isNull(signupInvite.usedAt)));
  revalidatePath("/admin");
  return { ok: true };
}

const setPasswordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres.").max(128),
});

export async function setPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSuperadmin();
  const parsed = setPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const requestHeaders = await headers();
  const failed = await tryAuthCall(async () => {
    await auth.api.setUserPassword({
      body: { userId: parsed.data.userId, newPassword: parsed.data.password },
      headers: requestHeaders,
    });
    // Whoever had the old password is signed out everywhere.
    await auth.api.revokeUserSessions({
      body: { userId: parsed.data.userId },
      headers: requestHeaders,
    });
  });
  if (failed) return failed;
  return { ok: true, message: "Contraseña cambiada. Pásasela por un canal privado." };
}

export async function setBannedAction(userId: string, banned: boolean): Promise<ActionResult> {
  const admin = await requireSuperadmin();
  const parsed = z.object({ userId: z.string().min(1), banned: z.boolean() }).safeParse({
    userId,
    banned,
  });
  if (!parsed.success) return { ok: false, error: "Datos no válidos." };
  if (parsed.data.userId === admin.id) return { ok: false, error: "No puedes bloquearte a ti mismo." };

  const requestHeaders = await headers();
  const body = { userId: parsed.data.userId };
  const failed = await tryAuthCall(() =>
    parsed.data.banned
      ? // Banning also signs the user out of every session.
        auth.api.banUser({ body, headers: requestHeaders })
      : auth.api.unbanUser({ body, headers: requestHeaders }),
  );
  if (failed) return failed;
  revalidatePath("/admin");
  return { ok: true };
}

async function tryAuthCall(call: () => Promise<unknown>): Promise<ActionResult | null> {
  try {
    await call();
    return null;
  } catch (error) {
    console.error("[admin] auth call failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "No se ha podido completar. Vuelve a intentarlo." };
  }
}
