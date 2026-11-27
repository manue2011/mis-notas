import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { page } from "@/db/schema";
import { canSeePage } from "@/lib/pages/scope";
import { requireWorkspaceById, WorkspaceForbiddenError, type WorkspaceAccess } from "@/lib/workspace/access";

/** You may add images to this page: it's live, in the workspace, yours to see, and your role allows uploads. */
export async function requirePageUpload(organizationId: string, pageId: string): Promise<WorkspaceAccess> {
  const access = await requireWorkspaceById(organizationId, { asset: ["create"] });
  if (!(await canSeePage(access, pageId))) throw new WorkspaceForbiddenError();
  const [found] = await db
    .select({ id: page.id })
    .from(page)
    .where(and(eq(page.id, pageId), eq(page.organizationId, access.organizationId), isNull(page.deletedAt)))
    .limit(1);
  if (!found) throw new WorkspaceForbiddenError();
  return access;
}
