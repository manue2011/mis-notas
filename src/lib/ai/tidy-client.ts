import { finishBlocks, type LooseBlock, type PageTarget } from "@/lib/notion/blocks";
import { parseOutline } from "@/lib/notion/outline";
import { TOGGLE, type TidySource } from "./tidy-markdown";

// The AI's Markdown back into blocks, in the browser (BlockNote parses it):
// the same reading as a Notion import, then the markers become the blocks
// and page links they stood for, and "- ▸ …" items toggles again.

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

type Inline = { type: string; text?: string };

/** A bullet (or a line) starting with ▸ was a toggle; it is one again, without the ▸. */
function restoreToggles(blocks: LooseBlock[]): LooseBlock[] {
  return blocks.map((block) => {
    const children = block.children?.length ? restoreToggles(block.children) : block.children;
    const [first, ...rest] = Array.isArray(block.content) ? (block.content as Inline[]) : [];
    const toggle =
      (block.type === "bulletListItem" || block.type === "paragraph") &&
      first?.type === "text" &&
      first.text?.trimStart().startsWith(TOGGLE.trim());
    if (!toggle) return { ...block, ...(children ? { children } : {}) };
    const text = first.text!.trimStart().slice(TOGGLE.trim().length).trimStart();
    return {
      ...block,
      type: "toggleListItem",
      content: text ? [{ ...first, text }, ...rest] : rest,
      ...(children ? { children } : {}),
    };
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
  return withoutIds(restoreToggles(blocks));
}
