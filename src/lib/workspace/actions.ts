"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { workspaceSettings } from "@/db/schema";
import { ACCENT_KEYS } from "@/lib/accent";
import { auth } from "@/lib/auth/auth";
import { requireUser } from "@/lib/auth/session";
import { requireWorkspaceById, WorkspaceForbiddenError } from "./access";
import { workspaceSlug } from "./slug";

export type WorkspaceActionResult = { ok: true } | { ok: false; error: string };
export type CreateWorkspaceState = { error: string } | null;

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ponle un nombre a tu espacio.")
    .max(60, "El nombre puede tener como mucho 60 caracteres."),
  accent: z.enum(ACCENT_KEYS),
});

export async function createWorkspaceAction(
  _prev: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  await requireUser();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    accent: formData.get("accent"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let slug: string;
  try {
    // The creator becomes the workspace "admin" (creatorRole) and it becomes
    // their active workspace. workspace_settings is created by the plugin hook.
    const created = await auth.api.createOrganization({
      body: { name: parsed.data.name, slug: workspaceSlug(parsed.data.name) },
      headers: await headers(),
    });
    if (!created) throw new Error("createOrganization returned nothing");
    await db
      .update(workspaceSettings)
      .set({ accentColor: parsed.data.accent, updatedAt: new Date() })
      .where(eq(workspaceSettings.organizationId, created.id));
    slug = created.slug;
  } catch (error) {
    console.error("[workspace] create failed:", error instanceof Error ? error.message : error);
    return { error: "No se ha podido crear el espacio. Vuelve a intentarlo." };
  }
  redirect(`/espacio/${slug}`);
}

const accentSchema = z.object({
  organizationId: z.string().min(1),
  accent: z.enum(ACCENT_KEYS),
});

export async function setAccentAction(
  organizationId: string,
  accent: string,
): Promise<WorkspaceActionResult> {
  const parsed = accentSchema.safeParse({ organizationId, accent });
  if (!parsed.success) return { ok: false, error: "Color no válido." };

  return withWorkspaceErrors(async () => {
    const access = await requireWorkspaceById(parsed.data.organizationId, {
      settings: ["update"],
    });
    await db
      .update(workspaceSettings)
      .set({ accentColor: parsed.data.accent, updatedAt: new Date() })
      .where(eq(workspaceSettings.organizationId, access.organizationId));
    revalidatePath(`/espacio/${access.slug}`, "layout");
  });
}

/** Remembers the last workspace opened, so "/" can go back to it. */
export async function rememberWorkspaceAction(organizationId: string): Promise<void> {
  const id = z.string().min(1).safeParse(organizationId);
  if (!id.success) return;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.session.activeOrganizationId === id.data) return;
  // set-active checks membership itself.
  await auth.api
    .setActiveOrganization({ body: { organizationId: id.data }, headers: await headers() })
    .catch(() => undefined);
}

async function withWorkspaceErrors(fn: () => Promise<void>): Promise<WorkspaceActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error; // includes notFound() for non-members
  }
}
