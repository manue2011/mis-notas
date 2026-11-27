"use server";

import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { inviteLink, member, memberPageScope, organization, workspaceSettings } from "@/db/schema";
import { ROLE_NAMES } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { pageScopeSchema, pagesExist } from "@/lib/pages/scope";
import { hashToken, newToken, TOKEN_PATTERN } from "@/lib/tokens";
import { requireWorkspaceById, WorkspaceForbiddenError } from "@/lib/workspace/access";
import {
  emailMatchesDomain,
  INVITE_LINK_DAY_OPTIONS,
  INVITE_LINK_TTL_DAYS,
  inviteProblemText,
  linkProblem,
  MAX_INVITE_USES,
} from "./rules";

export type CreateLinkResult = { ok: true; url: string } | { ok: false; error: string };
export type InviteActionResult = { ok: true; message: string } | { ok: false; error: string };

const orgIdSchema = z.string().min(1);

const linkOptionsSchema = z.object({
  role: z.enum(ROLE_NAMES),
  days: z.number().refine((d) => (INVITE_LINK_DAY_OPTIONS as readonly number[]).includes(d)),
  maxUses: z.int().min(1).max(MAX_INVITE_USES).nullable(),
  /** What whoever joins may see; null (or left out) for the whole workspace. */
  pageIds: pageScopeSchema.optional(),
});

export type InviteLinkOptions = z.infer<typeof linkOptionsSchema>;

/**
 * A new invite link. Without options it's the sidebar card's: editor role,
 * 7 days, unlimited uses, the whole workspace. Only its hash is stored, so
 * the URL is shown once.
 */
export async function createInviteLinkAction(
  organizationId: string,
  options: InviteLinkOptions = { role: "editor", days: INVITE_LINK_TTL_DAYS, maxUses: null },
): Promise<CreateLinkResult> {
  const id = orgIdSchema.safeParse(organizationId);
  const opts = linkOptionsSchema.safeParse(options);
  if (!id.success) return { ok: false, error: "Espacio no válido." };
  if (!opts.success) return { ok: false, error: "Revisa las opciones del enlace." };

  try {
    const access = await requireWorkspaceById(id.data, { inviteLink: ["create"] });
    // Admins see the whole workspace whatever the link says.
    const pageIds = opts.data.role === "admin" ? null : (opts.data.pageIds ?? null);
    if (pageIds && !(await pagesExist(access.organizationId, pageIds))) {
      return { ok: false, error: "Una de las páginas ya no existe. Recarga y vuelve a elegir." };
    }
    const token = newToken();
    await db.insert(inviteLink).values({
      organizationId: access.organizationId,
      tokenHash: hashToken(token),
      role: opts.data.role,
      expiresAt: new Date(Date.now() + opts.data.days * 24 * 60 * 60 * 1000),
      maxUses: opts.data.maxUses,
      pageIds: pageIds ? [...new Set(pageIds)] : null,
      createdBy: access.userId,
    });
    revalidatePath(`/espacio/${access.slug}/ajustes`);
    return { ok: true, url: new URL(`/unirse/${token}`, env().BETTER_AUTH_URL).toString() };
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function revokeInviteLinkAction(organizationId: string, linkId: string): Promise<InviteActionResult> {
  const input = z.object({ organizationId: orgIdSchema, linkId: z.uuid() }).safeParse({ organizationId, linkId });
  if (!input.success) return { ok: false, error: "Enlace no válido." };

  try {
    const access = await requireWorkspaceById(input.data.organizationId, { inviteLink: ["revoke"] });
    const [revoked] = await db
      .update(inviteLink)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(inviteLink.id, input.data.linkId),
          eq(inviteLink.organizationId, access.organizationId),
          isNull(inviteLink.revokedAt),
        ),
      )
      .returning({ id: inviteLink.id });
    revalidatePath(`/espacio/${access.slug}/ajustes`);
    return revoked ? { ok: true, message: "Enlace anulado." } : { ok: false, error: "Ese enlace ya estaba anulado." };
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function revokeAllInviteLinksAction(organizationId: string): Promise<InviteActionResult> {
  const id = orgIdSchema.safeParse(organizationId);
  if (!id.success) return { ok: false, error: "Espacio no válido." };

  try {
    const access = await requireWorkspaceById(id.data, { inviteLink: ["revoke"] });
    const revoked = await db
      .update(inviteLink)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(inviteLink.organizationId, access.organizationId),
          isNull(inviteLink.revokedAt),
          gt(inviteLink.expiresAt, sql`now()`),
        ),
      )
      .returning({ id: inviteLink.id });
    revalidatePath(`/espacio/${access.slug}/ajustes`);
    return {
      ok: true,
      message: revoked.length
        ? `Anulados ${revoked.length} ${revoked.length === 1 ? "enlace" : "enlaces"}.`
        : "No había enlaces activos.",
    };
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error;
  }
}

/**
 * Joins the current user to the link's workspace. The link row is locked for
 * the whole check-and-insert, so a limited link can't be overused by people
 * accepting at the same time.
 */
export async function acceptInviteAction(token: string): Promise<{ error: string } | void> {
  if (!TOKEN_PATTERN.test(token)) return { error: "Este enlace no es válido." };
  const user = await requireUser();

  const result = await db.transaction(async (tx): Promise<{ error: string } | { slug: string }> => {
    const [link] = await tx
      .select({
        id: inviteLink.id,
        organizationId: inviteLink.organizationId,
        role: inviteLink.role,
        revokedAt: inviteLink.revokedAt,
        expiresAt: inviteLink.expiresAt,
        maxUses: inviteLink.maxUses,
        uses: inviteLink.uses,
        pageIds: inviteLink.pageIds,
      })
      .from(inviteLink)
      .where(eq(inviteLink.tokenHash, hashToken(token)))
      .for("update");
    if (!link) return { error: "Este enlace no es válido." };

    const [org] = await tx
      .select({ slug: organization.slug, allowedEmailDomain: workspaceSettings.allowedEmailDomain })
      .from(organization)
      .innerJoin(workspaceSettings, eq(workspaceSettings.organizationId, organization.id))
      .where(eq(organization.id, link.organizationId));
    if (!org) return { error: "Este espacio ya no existe." };

    // Already in: just go there, without spending a use.
    const [existing] = await tx
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.organizationId, link.organizationId), eq(member.userId, user.id)));
    if (existing) return { slug: org.slug };

    const problem = linkProblem(link);
    if (problem) return { error: inviteProblemText[problem] };
    if (!emailMatchesDomain(user.email, org.allowedEmailDomain)) return { error: inviteProblemText.domain };

    const memberId = randomBytes(24).toString("base64url");
    await tx.insert(member).values({
      id: memberId,
      organizationId: link.organizationId,
      userId: user.id,
      role: link.role,
      createdAt: new Date(),
    });
    // A link for some pages: they see those (and what's inside), nothing else.
    if (link.pageIds && link.role !== "admin") {
      await tx
        .insert(memberPageScope)
        .values({ memberId, organizationId: link.organizationId, pageIds: link.pageIds });
    }
    await tx
      .update(inviteLink)
      .set({ uses: sql`${inviteLink.uses} + 1` })
      .where(eq(inviteLink.id, link.id));
    return { slug: org.slug };
  });

  if ("error" in result) return result;
  revalidatePath("/", "layout");
  redirect(`/espacio/${result.slug}`);
}
