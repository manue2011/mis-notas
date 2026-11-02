import { z } from "zod";

// Block types the editor offers. Anything else is rejected so a crafted
// request can't store content the editor would choke on.
// Keep in sync with src/components/page/editor/schema.ts.
export const PAGE_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "quote",
  "codeBlock",
  "screenshot",
  "stickyNote",
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

/**
 * Screenshots may only point at images this workspace uploaded: the
 * configured Cloudinary account, inside the workspace's folder. An empty url
 * is a screenshot block still waiting for its image.
 */
function screenshotUrlPattern(cloudName: string | undefined, organizationId: string): RegExp | null {
  if (!cloudName) return null;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^https://res\\.cloudinary\\.com/${esc(cloudName)}/image/upload/(v\\d+/)?libreta/${esc(organizationId)}/[0-9a-f-]{36}\\.webp$`,
  );
}

function screenshotsAreOwn(blocks: Block[], pattern: RegExp | null): boolean {
  return blocks.every((block) => {
    if (block.type === "screenshot") {
      const url = block.props?.url;
      if (url !== undefined && url !== "" && (typeof url !== "string" || !pattern?.test(url))) {
        return false;
      }
    }
    return screenshotsAreOwn(block.children ?? [], pattern);
  });
}

export function pageContentSchema(input: { organizationId: string; cloudName: string | undefined }) {
  const pattern = screenshotUrlPattern(input.cloudName, input.organizationId);
  return z
    .array(blockSchema)
    .max(5000)
    .refine((blocks) => JSON.stringify(blocks).length <= MAX_CONTENT_BYTES, {
      message: "La página es demasiado grande.",
    })
    .refine((blocks) => screenshotsAreOwn(blocks, pattern), {
      message: "Hay una imagen que no pertenece a este espacio.",
    });
}

export const pageTitleSchema = z.string().trim().max(MAX_TITLE_LENGTH);
