"use server";

import { z } from "zod";
import { requireWorkspaceById } from "@/lib/workspace/access";
import { searchPages, searchQuerySchema, type SearchHit } from "./search";

const PALETTE_RESULTS = 8;

/** Search for the command palette (the results screen queries directly). */
export async function searchPagesAction(organizationId: string, query: string): Promise<SearchHit[]> {
  const input = z.object({ organizationId: z.string().min(1), query: searchQuerySchema }).safeParse({
    organizationId,
    query,
  });
  if (!input.success) return [];

  const access = await requireWorkspaceById(input.data.organizationId, { page: ["read"] });
  return searchPages(access.organizationId, input.data.query, PALETTE_RESULTS);
}
