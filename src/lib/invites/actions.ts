"use server";

import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { inviteLink, member, organization, workspaceSettings } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { hashToken, newToken, TOKEN_PATTERN } from "@/lib/tokens";
import { requireWorkspaceById, WorkspaceForbiddenError } from "@/lib/workspace/access";
import { emailMatchesDomain, INVITE_LINK_TTL_DAYS, inviteProblemText, linkProblem } from "./rules";

export type CreateLinkResult = { ok: true; url: string } | { ok: false; error: string };
export type InviteActionResult = { ok: true; message: string } | { ok: false; error: string };

const orgIdSchema = z.string().min(1);

/** The sidebar card's link: editor role, 7 days, unlimited uses. */
export async function createInviteLinkAction(organizationId: string): Promise<CreateLinkResult> {
  const id = orgIdSchema.safeParse(organizationId);
  if (!id.success) return { ok: false, error: "Espacio no válido." };

  try {
    const access = await requireWorkspaceById(id.data, { inviteLink: ["create"] });
    const token = newToken();
    await db.insert(inviteLink).values({
      organizationId: access.organizationId,
      tokenHash: hashToken(token),
      role: "editor",
      expiresAt: new Date(Date.now() + INVITE_LINK_TTL_DAYS * 24 * 60 * 60 * 1000),
      maxUses: null,
      createdBy: access.userId,
    });
    return { ok: true, url: new URL(`/unirse/${token}`, env().BETTER_AUTH_URL).toString() };
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

    await tx.insert(member).values({
      id: randomBytes(24).toString("base64url"),
      organizationId: link.organizationId,
      userId: user.id,
      role: link.role,
      createdAt: new Date(),
    });
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
