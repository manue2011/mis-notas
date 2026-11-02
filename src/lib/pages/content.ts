import { z } from "zod";

// Block types the editor offers in phase 1. Step 8 adds screenshots, sticky
// notes and code. Anything else is rejected so a crafted request can't store
// content the editor would choke on.
export const PAGE_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "quote",
] as const;

export const MAX_CONTENT_BYTES = 1_000_000;
export const MAX_TITLE_LENGTH = 200;

type Block = {
  id?: string;
  type: (typeof PAGE_BLOCK_TYPES)[number];
  props?: Record<string, unknown>;
  content?: unknown;
  children?: Block[];
};

const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.object({
    id: z.string().max(64).optional(),
    type: z.enum(PAGE_BLOCK_TYPES),
    props: z.record(z.string(), z.unknown()).optional(),
    content: z.unknown().optional(),
    children: z.array(blockSchema).max(500).optional(),
  }),
);

export const pageContentSchema = z
  .array(blockSchema)
  .max(5000)
  .refine((blocks) => JSON.stringify(blocks).length <= MAX_CONTENT_BYTES, {
    message: "La página es demasiado grande.",
  });

export const pageTitleSchema = z.string().trim().max(MAX_TITLE_LENGTH);
