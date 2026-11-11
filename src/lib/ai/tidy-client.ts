import { finishBlocks, type LooseBlock, type PageTarget } from "@/lib/notion/blocks";
import { parseOutline } from "@/lib/notion/outline";
import type { TidySource } from "./tidy-markdown";

// The AI's Markdown back into blocks, in the browser (BlockNote parses it):
// the same reading as a Notion import, then the markers become the blocks
// and page links they stood for.

type Parse = (markdown: string) => LooseBlock[];

/** Fresh ids everywhere: BlockNote gives them when the blocks go in. */
function withoutIds(blocks: LooseBlock[]): LooseBlock[] {
  return blocks.map((block) => {
    const copy: LooseBlock = { ...block };
    delete copy.id;
    if (block.children?.length) copy.children = withoutIds(block.children);
    return copy;
  });
}

export function tidyBlocks(markdown: string, source: TidySource, parse: Parse): LooseBlock[] {
  const used = new Set<string>();
  const blocks = finishBlocks(parseOutline(markdown, parse), {
    replaceMarker: (marker) => {
      const block = source.blocks.get(marker);
      if (!block) return undefined;
      // The server already dropped repeats; never put one block in twice.
      if (used.has(marker)) return null;
      used.add(marker);
      return block as LooseBlock;
    },
    linkTarget: (href) => {
      const props = source.links.get(href)?.props;
      return typeof props?.pageId === "string" ? ({ ...props } as PageTarget) : null;
    },
  });
  return withoutIds(blocks);
}
