"use server";

import { and, desc, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { page, pageVersion, user } from "@/db/schema";
import { env } from "@/lib/env";
import { requireWorkspaceById, WorkspaceForbiddenError, type WorkspaceAccess } from "@/lib/workspace/access";
import { pageContentSchema } from "./content";
import { diffVersions, type VersionDiff } from "./version-diff";
import { MAX_VERSIONS, recordPageVersion, type PageVersionKind } from "./versions";

// The page's history panel: the list of versions, one version with what it
// changed, and noting an AI tidy or a restore as such.

export type PageVersionSummary = { id: string; kind: PageVersionKind; editedByName: string | null; savedAt: string };

export type PageVersionDetail = PageVersionSummary & {
  title: string;
  content: unknown[];
  /** Against the version before it; null for the oldest one. */
  diff: VersionDiff | null;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const idsSchema = z.object({ organizationId: z.string().min(1), pageId: z.uuid() });

async function access(organizationId: string, pageId: string, action: "read" | "update") {
  const ids = idsSchema.safeParse({ organizationId, pageId });
  if (!ids.success) return { ok: false, error: "Página no válida." } as const;
  let found: WorkspaceAccess;
  try {
    found = await requireWorkspaceById(ids.data.organizationId, { page: [action] });
  } catch (error) {
    if (error instanceof WorkspaceForbiddenError) return { ok: false, error: error.message } as const;
    throw error;
  }
  // The page must be in this workspace (versions are looked up by page).
  const [row] = await db
    .select({ id: page.id })
    .from(page)
    .where(and(eq(page.id, ids.data.pageId), eq(page.organizationId, found.organizationId)))
    .limit(1);
  if (!row) return { ok: false, error: "Esta página ya no existe." } as const;
  return { ok: true, access: found, pageId: ids.data.pageId } as const;
}

const summaryColumns = {
  id: pageVersion.id,
  kind: pageVersion.kind,
  editedByName: user.name,
  savedAt: pageVersion.savedAt,
};

const toSummary = <T extends { savedAt: Date }>(row: T) => ({ ...row, savedAt: row.savedAt.toISOString() });

/** The page's versions, newest first. Anyone who can read the page can see them. */
export async function listPageVersionsAction(
  organizationId: string,
  pageId: string,
): Promise<Result<PageVersionSummary[]>> {
  const found = await access(organizationId, pageId, "read");
  if (!found.ok) return { ok: false, error: found.error };
  const rows = await db
    .select(summaryColumns)
    .from(pageVersion)
    .leftJoin(user, eq(pageVersion.editedBy, user.id))
    .where(eq(pageVersion.pageId, found.pageId))
    .orderBy(desc(pageVersion.savedAt))
    .limit(MAX_VERSIONS);
  return { ok: true, data: rows.map(toSummary) };
}

/** One version, with what it changed from the one before. */
export async function getPageVersionAction(
  organizationId: string,
  pageId: string,
  versionId: string,
): Promise<Result<PageVersionDetail>> {
  const found = await access(organizationId, pageId, "read");
  if (!found.ok) return { ok: false, error: found.error };
  if (!z.uuid().safeParse(versionId).success) return { ok: false, error: "Versión no válida." };

  const [version] = await db
    .select({ ...summaryColumns, title: pageVersion.title, content: pageVersion.content })
    .from(pageVersion)
    .leftJoin(user, eq(pageVersion.editedBy, user.id))
    .where(and(eq(pageVersion.id, versionId), eq(pageVersion.pageId, found.pageId)))
    .limit(1);
  if (!version) return { ok: false, error: "Esta versión ya no está en el historial." };

  const [previous] = await db
    .select({ title: pageVersion.title, content: pageVersion.content })
    .from(pageVersion)
    .where(and(eq(pageVersion.pageId, found.pageId), lt(pageVersion.savedAt, version.savedAt)))
    .orderBy(desc(pageVersion.savedAt))
    .limit(1);

  return { ok: true, data: { ...toSummary(version), diff: previous ? diffVersions(previous, version) : null } };
}

/**
 * Notes that the page was just tidied with AI, or restored (or the AI's
 * tidy undone), with what it now holds; the editor saves it a moment later
 * and that save folds into this version.
 */
export async function recordPageVersionAction(
  organizationId: string,
  pageId: string,
  kind: "ai" | "restore",
  content: unknown,
): Promise<{ ok: boolean }> {
  if (kind !== "ai" && kind !== "restore") return { ok: false };
  const found = await access(organizationId, pageId, "update");
  if (!found.ok) return { ok: false };
  const parsed = pageContentSchema({
    organizationId: found.access.organizationId,
    cloudName: env().CLOUDINARY_CLOUD_NAME,
  }).safeParse(content);
  if (!parsed.success) return { ok: false };
  await recordPageVersion({
    organizationId: found.access.organizationId,
    pageId: found.pageId,
    userId: found.access.userId,
    kind,
    content: parsed.data,
  });
  return { ok: true };
}
