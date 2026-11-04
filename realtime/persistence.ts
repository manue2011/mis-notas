import { ServerBlockNoteEditor } from "@blocknote/server-util";
import { and, eq, isNull, sql } from "drizzle-orm";
import * as Y from "yjs";
import { db } from "@/db";
import { page, user } from "@/db/schema";
import { sweepPageAssets } from "@/lib/assets/sweep";
import { serverPageSchema } from "./schema";
import { dropForeignScreenshots, extractSearchText, MAX_TITLE_LENGTH } from "@/lib/pages/content";
import { CONTENT_FRAGMENT, TITLE_TEXT } from "@/lib/realtime/doc";
import { env } from "./env";

// Loading pages into Yjs documents and saving them back to Postgres.

const editor = ServerBlockNoteEditor.create({ schema: serverPageSchema });

/**
 * Yjs author id used when building a document from saved blocks. Fixed, so
 * two builds of the same page produce the very same items: if the server
 * restarts before saving and rebuilds, a browser still holding the first
 * build merges with the second instead of getting everything twice.
 */
const SEED_CLIENT_ID = 1;

export type PageRef = { organizationId: string; pageId: string };

/**
 * Fills a fresh document with the page. Pages edited before real-time
 * existed (or saved over plain HTTP since) have no Yjs state yet: they're
 * built from their stored blocks and title.
 */
export async function loadPage(doc: Y.Doc, { organizationId, pageId }: PageRef): Promise<boolean> {
  const [row] = await db
    .select({
      organizationId: page.organizationId,
      title: page.title,
      content: page.content,
      yjsState: page.yjsState,
    })
    .from(page)
    .where(eq(page.id, pageId))
    .limit(1);
  if (!row || row.organizationId !== organizationId) return false;

  if (row.yjsState) {
    Y.applyUpdate(doc, row.yjsState);
    return true;
  }

  const seed = new Y.Doc();
  seed.clientID = SEED_CLIENT_ID;
  seed.transact(() => {
    if (row.content.length) {
      editor.blocksToYXmlFragment(row.content as never, seed.getXmlFragment(CONTENT_FRAGMENT));
    }
    seed.getText(TITLE_TEXT).insert(0, row.title);
  });
  const update = Y.encodeStateAsUpdate(seed);
  seed.destroy();
  Y.applyUpdate(doc, update);
  // Keep the build, so later loads start from it rather than building again.
  await db
    .update(page)
    .set({ yjsState: update })
    .where(and(eq(page.id, pageId), isNull(page.yjsState)));
  return true;
}

/** Saves the document and everything derived from it (blocks, title, search text). */
export async function storePage(doc: Y.Doc, { organizationId, pageId }: PageRef, userId: string): Promise<void> {
  const blocks = dropForeignScreenshots(editor.yXmlFragmentToBlocks(doc.getXmlFragment(CONTENT_FRAGMENT)), {
    organizationId,
    cloudName: env().CLOUDINARY_CLOUD_NAME,
  });
  const title = doc.getText(TITLE_TEXT).toString().trim().slice(0, MAX_TITLE_LENGTH);

  await db
    .update(page)
    .set({
      yjsState: Y.encodeStateAsUpdate(doc),
      content: blocks,
      title,
      searchText: extractSearchText(blocks),
      // Null if the person's account was deleted meanwhile; the save still goes through.
      updatedBy: sql`(select ${user.id} from ${user} where ${user.id} = ${userId})`,
      updatedAt: new Date(),
    })
    .where(eq(page.id, pageId));

  await sweepPageAssets(organizationId, pageId, blocks).catch((error) =>
    console.error("[realtime] image sweep failed:", error instanceof Error ? error.message : error),
  );
}
