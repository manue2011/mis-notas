// After BlockNote parses a page: marker paragraphs become screenshots or
// sticky notes, links to other exported pages become "@" page links, and a
// database becomes a list of its rows.

export type LooseBlock = {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: LooseBlock[];
};
type Inline = {
  type: string;
  text?: string;
  styles?: Record<string, unknown>;
  href?: string;
  content?: Inline[];
  props?: Record<string, unknown>;
};
export type PageTarget = { pageId: string; title: string };

export const text = (value: string): Inline => ({ type: "text", text: value, styles: {} });
export const pageLink = (target: PageTarget): Inline => ({ type: "pageLink", props: { ...target } });

function onlyText(block: LooseBlock): string | null {
  const content = block.content;
  if (block.type !== "paragraph" || !Array.isArray(content) || content.length !== 1) return null;
  const [only] = content as Inline[];
  return only.type === "text" ? (only.text ?? "").trim() : null;
}

export function finishBlocks(
  blocks: LooseBlock[],
  options: {
    /** The block a marker paragraph stands for (null drops it). */
    replaceMarker: (marker: string) => LooseBlock | null | undefined;
    /** The imported page a link points at, if it's one. */
    linkTarget: (href: string) => PageTarget | null;
  },
): LooseBlock[] {
  const inline = (items: Inline[]): Inline[] =>
    items.map((item) => {
      if (item.type !== "link" || !item.href) return item;
      const target = options.linkTarget(item.href);
      return target ? pageLink(target) : item;
    });

  const out: LooseBlock[] = [];
  for (const block of blocks) {
    const marker = onlyText(block);
    const replacement = marker ? options.replaceMarker(marker) : undefined;
    if (replacement === null) continue;
    if (replacement) {
      out.push(replacement);
      continue;
    }
    out.push({
      ...block,
      ...(Array.isArray(block.content) ? { content: inline(block.content as Inline[]) } : {}),
      ...(block.children?.length ? { children: finishBlocks(block.children, options) } : {}),
    });
  }
  return out;
}

const MAX_PROPERTIES = 6;

/** A database as a list: each row's name (linked to its page when there is one) and its properties. */
export function databaseBlocks(rows: string[][], rowTarget: (name: string) => PageTarget | null): LooseBlock[] {
  const [header, ...data] = rows;
  if (!header) return [];
  return data.map((row) => {
    const name = row[0]?.trim() || "Sin título";
    const target = rowTarget(name);
    const properties = header
      .slice(1)
      .map((column, i) => [column.trim(), row[i + 1]?.trim() ?? ""] as const)
      .filter(([column, value]) => column && value)
      .slice(0, MAX_PROPERTIES)
      .map(([column, value]) => `${column}: ${value}`)
      .join(" · ");
    return {
      type: "bulletListItem",
      content: [target ? pageLink(target) : text(name), ...(properties ? [text(` — ${properties}`)] : [])],
    };
  });
}
