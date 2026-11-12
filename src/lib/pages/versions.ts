import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { page, pageVersion, user } from "@/db/schema";

// The page's history. Every save goes through recordPageVersion before the
// page itself is updated: a person's saves close together fold into one
// version, so the history reads "Ana · 14:32", not one line per keystroke.
// The real-time server (realtime/persistence.ts) and the plain saves
// (actions.ts) both call it; tidying with AI and restoring call it too
// (version-actions.ts), so they show up as such.

export type PageVersionKind = (typeof pageVersion.$inferSelect)["kind"];

/** A person's saves within this long of their last one fold into the same version. */
const STRETCH_MS = 10 * 60_000;
/** An AI tidy or a restore takes in the saves that follow it for this long (the editor saving it). */
const FOLLOW_UP_MS = 2 * 60_000;
/** How long versions are kept, and at most how many per page. */
export const VERSION_DAYS = 30;
export const MAX_VERSIONS = 50;

type Input = {
  organizationId: string;
  pageId: string;
  /** Who saved; null if unknown (their account is gone). */
  userId: string | null;
  kind?: PageVersionKind;
  /** The page as it is about to be saved; what isn't given stays as it is. */
  title?: string;
  content?: unknown[];
};

export async function recordPageVersion({ organizationId, pageId, userId, kind = "edit", ...next }: Input) {
  await db.transaction(async (tx) => {
    // One save at a time per page, so two never both start a version.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${pageId}))`);

    const [current] = await tx
      .select({ title: page.title, content: page.content, updatedBy: page.updatedBy, updatedAt: page.updatedAt })
      .from(page)
      .where(and(eq(page.id, pageId), eq(page.organizationId, organizationId)))
      .limit(1);
    if (!current) return;
    const title = next.title ?? current.title;
    const content = next.content ?? current.content;

    const latestQuery = () =>
      tx
        .select({
          id: pageVersion.id,
          kind: pageVersion.kind,
          editedBy: pageVersion.editedBy,
          savedAt: pageVersion.savedAt,
          // jsonb compares by value (it reorders keys), so compare there.
          same: sql<boolean>`${pageVersion.title} = ${title} and ${pageVersion.content} = ${JSON.stringify(content)}::jsonb`,
        })
        .from(pageVersion)
        .where(eq(pageVersion.pageId, pageId))
        .orderBy(desc(pageVersion.savedAt))
        .limit(1);

    let [latest] = await latestQuery();
    let startsHistory = false;
    if (!latest && (current.title || current.content.length)) {
      // The first save since history began: keep the page as it was before it.
      await tx.insert(pageVersion).values({
        pageId,
        organizationId,
        title: current.title,
        content: current.content,
        editedBy: current.updatedBy,
        createdAt: current.updatedAt,
        savedAt: current.updatedAt,
      });
      [latest] = await latestQuery();
      startsHistory = true;
    }

    if (latest?.same && kind === "edit") return;

    const now = new Date();
    const folds =
      latest &&
      !startsHistory &&
      kind === "edit" &&
      userId !== null &&
      latest.editedBy === userId &&
      now.getTime() - latest.savedAt.getTime() < (latest.kind === "edit" ? STRETCH_MS : FOLLOW_UP_MS);

    if (folds) {
      await tx.update(pageVersion).set({ title, content, savedAt: now }).where(eq(pageVersion.id, latest.id));
      return;
    }
    await tx.insert(pageVersion).values({
      pageId,
      organizationId,
      kind,
      title,
      content,
      // Null if the person's account was deleted meanwhile.
      editedBy: userId === null ? null : sql`(select ${user.id} from ${user} where ${user.id} = ${userId})`,
      savedAt: now,
    });

    // Forget what's too old, and anything past the newest MAX_VERSIONS.
    await tx.execute(sql`
      delete from ${pageVersion}
      where ${pageVersion.pageId} = ${pageId}
        and (
          ${pageVersion.savedAt} < now() - make_interval(days => ${VERSION_DAYS})
          or ${pageVersion.id} not in (
            select id from ${pageVersion} where ${pageVersion.pageId} = ${pageId}
            order by ${pageVersion.savedAt} desc limit ${MAX_VERSIONS}
          )
        )
    `);
  });
}
