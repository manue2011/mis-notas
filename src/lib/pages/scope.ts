import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/db";
import { page } from "@/db/schema";
import type { WorkspaceAccess } from "@/lib/workspace/access";
import { scopeIds } from "./tree";

// Members limited to some pages (access.pageScope) see those pages and
// everything inside them, and nothing else: every read and write of a page
// checks it here, on top of the role.

const loadScope = cache(async (organizationId: string, scopeKey: string) => {
  // Trashed pages too: the trash shows what was deleted inside their pages.
  const pages = await db
    .select({ id: page.id, parentId: page.parentId })
    .from(page)
    .where(eq(page.organizationId, organizationId));
  return scopeIds(pages, scopeKey ? scopeKey.split(",") : []);
});

/** Ids of every page (live or in the trash) this person may see; null: all of them. */
export async function visiblePageIds(access: WorkspaceAccess): Promise<Set<string> | null> {
  if (!access.pageScope) return null;
  return loadScope(access.organizationId, access.pageScope.join(","));
}

export async function canSeePage(access: WorkspaceAccess, pageId: string): Promise<boolean> {
  const visible = await visiblePageIds(access);
  return !visible || visible.has(pageId);
}

/** New pages from limited people go inside their pages, never at the top. */
export async function canCreateUnder(access: WorkspaceAccess, parentId: string | null): Promise<boolean> {
  if (!access.pageScope) return true;
  return parentId !== null && (await canSeePage(access, parentId));
}

/**
 * The pages a limited person was given belong to the admins' structure:
 * they can edit them and everything inside, but not move or delete them.
 */
export function isScopeRoot(access: WorkspaceAccess, pageId: string): boolean {
  return access.pageScope?.includes(pageId) ?? false;
}

/** A pick of pages for a member or an invite link: null means the whole workspace. */
export const pageScopeSchema = z.array(z.uuid()).min(1).max(500).nullable();

/** Whether every picked page is a live page of the workspace. */
export async function pagesExist(organizationId: string, pageIds: string[]): Promise<boolean> {
  const unique = [...new Set(pageIds)];
  const found = await db
    .select({ id: page.id })
    .from(page)
    .where(and(eq(page.organizationId, organizationId), inArray(page.id, unique), isNull(page.deletedAt)));
  return found.length === unique.length;
}
