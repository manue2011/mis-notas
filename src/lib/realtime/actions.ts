"use server";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { page } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { can, requireWorkspaceById } from "@/lib/workspace/access";
import { issueTicket } from "./ticket";

export type TicketResult = { ok: true; token: string } | { ok: false };

/**
 * A fresh ticket for the real-time server, asked for on every (re)connection.
 * Membership and role are checked here, each time, so someone removed from
 * the workspace can't reconnect.
 */
export async function getPageTicketAction(organizationId: string, pageId: string): Promise<TicketResult> {
  const input = z.object({ organizationId: z.string().min(1), pageId: z.uuid() }).safeParse({ organizationId, pageId });
  const secret = env().REALTIME_SECRET;
  if (!input.success || !secret) return { ok: false };

  const [access, user] = await Promise.all([
    requireWorkspaceById(input.data.organizationId, { page: ["read"] }),
    requireUser(),
  ]);
  const [found] = await db
    .select({ id: page.id })
    .from(page)
    .where(and(eq(page.id, input.data.pageId), eq(page.organizationId, access.organizationId), isNull(page.deletedAt)))
    .limit(1);
  if (!found) return { ok: false };

  return {
    ok: true,
    token: issueTicket(
      {
        userId: access.userId,
        name: user.name,
        organizationId: access.organizationId,
        pageId: found.id,
        canEdit: can(access.role, { page: ["update"] }),
      },
      secret,
    ),
  };
}
