"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiUsage, page } from "@/db/schema";
import { aiEnabled, env } from "@/lib/env";
import { pageContentSchema, pageTitleSchema } from "@/lib/pages/content";
import { requireWorkspaceById, WorkspaceForbiddenError, type WorkspaceAccess } from "@/lib/workspace/access";
import { groqChat, GroqError } from "./groq";
import { checkTidyMarkdown, toTidyMarkdown, type TidyBlock } from "./tidy-markdown";
import { DAILY_TIDY_LIMIT, MAX_TIDY_CHARS } from "./limits";
import { TIDY_SYSTEM_PROMPT, tidyMaxTokens, tidyUserMessage } from "./tidy-prompt";

export type TidyResult = { ok: true; markdown: string; remaining: number } | { ok: false; error: string };

const inputSchema = z.object({ organizationId: z.string().min(1), pageId: z.uuid(), title: pageTitleSchema });

const today = () => new Date().toISOString().slice(0, 10);

/** Counts one use; false when the person has used up today's. */
async function takeUse(userId: string): Promise<number | null> {
  const [row] = await db
    .insert(aiUsage)
    .values({ userId, day: today(), uses: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { uses: sql`${aiUsage.uses} + 1` },
      setWhere: sql`${aiUsage.uses} < ${DAILY_TIDY_LIMIT}`,
    })
    .returning({ uses: aiUsage.uses });
  return row ? DAILY_TIDY_LIMIT - row.uses : null;
}

async function giveBackUse(userId: string) {
  await db
    .update(aiUsage)
    .set({ uses: sql`greatest(${aiUsage.uses} - 1, 0)` })
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, today())));
}

/**
 * "Ordenar esta página": the AI's tidier version of the blocks it's given,
 * as Markdown with the same markers (see tidy-markdown.ts). Nothing is
 * saved here; the person sees it first and applies it in the editor.
 */
export async function tidyPageAction(
  organizationId: string,
  pageId: string,
  title: string,
  blocks: unknown,
): Promise<TidyResult> {
  if (!aiEnabled()) return { ok: false, error: "La IA no está activada en esta Libreta." };
  const input = inputSchema.safeParse({ organizationId, pageId, title });
  if (!input.success) return { ok: false, error: "Página no válida." };

  let access: WorkspaceAccess;
  try {
    access = await requireWorkspaceById(input.data.organizationId, { page: ["update"] });
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message };
    throw error;
  }

  const content = pageContentSchema({
    organizationId: access.organizationId,
    cloudName: env().CLOUDINARY_CLOUD_NAME,
  }).safeParse(blocks);
  if (!content.success) return { ok: false, error: "El contenido de la página no es válido." };

  const [row] = await db
    .select({ id: page.id })
    .from(page)
    .where(and(eq(page.id, input.data.pageId), eq(page.organizationId, access.organizationId), isNull(page.deletedAt)))
    .limit(1);
  if (!row) return { ok: false, error: "Esta página ya no existe." };

  const source = toTidyMarkdown(content.data as TidyBlock[]);
  if (!/[\p{L}\p{N}]/u.test(source.markdown.replace(/LIBRETA(BLOQUE|ENLACE)\d+X/g, ""))) {
    return { ok: false, error: "Esta página no tiene texto que ordenar." };
  }
  if (source.markdown.length > MAX_TIDY_CHARS) {
    return { ok: false, error: "La página es demasiado larga para ordenarla de una vez. Prueba a dividirla en subpáginas." };
  }

  const remaining = await takeUse(access.userId);
  if (remaining === null) {
    return { ok: false, error: `Ya has ordenado ${DAILY_TIDY_LIMIT} páginas hoy. Mañana puedes seguir.` };
  }

  let answer: string;
  try {
    answer = await groqChat(
      [
        { role: "system", content: TIDY_SYSTEM_PROMPT },
        { role: "user", content: tidyUserMessage(input.data.title, source.markdown) },
      ],
      tidyMaxTokens(source.markdown),
    );
  } catch (error) {
    await giveBackUse(access.userId);
    console.error("[ai] tidy failed:", error instanceof Error ? error.message : error);
    return {
      ok: false,
      error:
        error instanceof GroqError && error.kind === "busy"
          ? "La IA está muy solicitada ahora mismo. Prueba otra vez en un minuto."
          : "La IA no ha respondido. Prueba otra vez en un rato.",
    };
  }

  const checked = checkTidyMarkdown(source, answer);
  if (!checked.ok) {
    console.warn("[ai] tidy answer rejected:", checked.reason);
    return {
      ok: false,
      error:
        checked.reason === "invented"
          ? "La IA ha añadido cosas que no estaban en la página, así que no te la proponemos. Prueba otra vez."
          : "La IA se ha dejado parte del texto, así que no te la proponemos. Prueba otra vez.",
    };
  }
  return { ok: true, markdown: checked.markdown, remaining };
}
