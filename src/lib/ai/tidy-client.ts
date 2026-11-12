import { finishBlocks, type LooseBlock, type PageTarget } from "@/lib/notion/blocks";
import { parseOutline } from "@/lib/notion/outline";
import { STICKY_TAG, TOGGLE, type TidySource } from "./tidy-markdown";

// The AI's Markdown back into blocks, in the browser (BlockNote parses it):
// the same reading as a Notion import, then the markers become the blocks
// and page links they stood for, "- ▸ …" items toggles again and
// "> [!nota] …" quotes sticky notes.

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

/** The block's text without the tag it starts with, or null if it doesn't. */
function untagged(block: LooseBlock, tag: string): Inline[] | null {
  const [first, ...rest] = Array.isArray(block.content) ? (block.content as Inline[]) : [];
  const start = first?.type === "text" ? (first.text ?? "").trimStart() : "";
  if (!start.toLowerCase().startsWith(tag.toLowerCase())) return null;
  const text = start.slice(tag.length).trimStart();
  return text ? [{ ...first, text }, ...rest] : rest;
}

/**
 * A bullet (or a line) starting with ▸ was a toggle, a quote starting with
 * [!nota] is a sticky note; they become so again, without the tag.
 */
function restoreTagged(blocks: LooseBlock[]): LooseBlock[] {
  return blocks.map((block) => {
    const children = block.children?.length ? restoreTagged(block.children) : block.children;
    const toggle =
      block.type === "bulletListItem" || block.type === "paragraph" ? untagged(block, TOGGLE.trim()) : null;
    if (toggle) return { ...block, type: "toggleListItem", content: toggle, ...(children ? { children } : {}) };
    const note = block.type === "quote" ? untagged(block, STICKY_TAG) : null;
    if (note) return { type: "stickyNote", content: note, ...(children ? { children } : {}) };
    return { ...block, ...(children ? { children } : {}) };
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
  return withoutIds(restoreTagged(blocks));
}
