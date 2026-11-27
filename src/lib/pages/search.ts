import "server-only";
import { and, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { page } from "@/db/schema";
import type { WorkspaceAccess } from "@/lib/workspace/access";
import { visiblePageIds } from "./scope";
import { searchTerms } from "./search-terms";

export type SearchHit = {
  id: string;
  title: string;
  /** A bit of the page's text around the first match, or null if only the title matched. */
  snippet: string | null;
  /** The snippet starts / ends partway through the text. */
  snippetCut: { start: boolean; end: boolean };
};

export const searchQuerySchema = z.string().trim().max(200);

const SNIPPET_BEFORE = 60;
const SNIPPET_LENGTH = 200;
const MAX_RESULTS = 30;

/** Same normalisation as the page_search_idx index, so it can be used. */
const fold = (value: SQL | string) => sql`f_unaccent(lower(${value}))`;
const escapeLike = (term: string) => term.replace(/[\\%_]/g, "\\$&");

/**
 * Live pages of a workspace whose title or text contains every word of the
 * query, ignoring case and accents. Title matches first, then most recent.
 * Only the pages this person may see (see ./scope).
 */
export async function searchPages(
  access: WorkspaceAccess,
  query: string,
  limit = MAX_RESULTS,
): Promise<SearchHit[]> {
  const terms = searchTerms(query);
  const visible = await visiblePageIds(access);
  if (terms.length === 0 || visible?.size === 0) return [];

  const haystack = fold(sql`${page.title} || ' ' || ${page.searchText}`);
  const contains = (target: SQL, term: string) => sql`${target} like '%' || ${fold(escapeLike(term))} || '%'`;
  const titleMatch = sql.join(
    terms.map((term) => contains(fold(sql`${page.title}`), term)),
    sql` and `,
  );
  // Where the first word found in the text appears (null if only the title matched).
  const position = sql`coalesce(${sql.join(
    terms.map((term) => sql`nullif(strpos(${fold(sql`${page.searchText}`)}, ${fold(term)}), 0)`),
    sql`, `,
  )})`;
  const start = sql`greatest(${position} - ${SNIPPET_BEFORE}, 1)`;

  const rows = await db
    .select({
      id: page.id,
      title: page.title,
      textLength: sql<number>`length(${page.searchText})`,
      snippetStart: sql<number>`${start}`,
      snippet: sql<string | null>`case when ${position} > 0
        then substring(${page.searchText} from ${start} for ${SNIPPET_LENGTH}) end`,
    })
    .from(page)
    .where(
      and(
        eq(page.organizationId, access.organizationId),
        isNull(page.deletedAt),
        visible ? inArray(page.id, [...visible]) : undefined,
        ...terms.map((term) => contains(haystack, term)),
      ),
    )
    .orderBy(desc(titleMatch), desc(page.updatedAt))
    .limit(Math.min(limit, MAX_RESULTS));

  return rows.map(({ id, title, textLength, snippetStart, snippet }) => ({
    id,
    title,
    snippet,
    snippetCut: {
      start: snippet !== null && snippetStart > 1,
      end: snippet !== null && snippetStart - 1 + snippet.length < textLength,
    },
  }));
}
