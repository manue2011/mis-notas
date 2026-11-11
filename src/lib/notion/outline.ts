import type { LooseBlock } from "./blocks";

// Notion exports toggles, and anything nested in a list, as list items with
// their contents indented below. BlockNote's Markdown parser loses that
// nesting as soon as a list item holds a paragraph or a picture, so lists
// are split up here by indentation, and only the plain stretches between
// them (and each item's own line) go through the parser.

type Parse = (markdown: string) => LooseBlock[];

const LIST_ITEM = /^([-*+]|\d+[.)])[ \t]+(.*)$/;
const CHECK = /^\[([ xX])\][ \t]+(.*)$/;
const FENCE = /^[ \t]*(```|~~~)/;

const indentOf = (line: string) => line.length - line.trimStart().length;
const isBlank = (line: string) => line.trim() === "";

function dedent(lines: string[]): string[] {
  const indents = lines.filter((line) => !isBlank(line)).map(indentOf);
  const by = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(Math.min(by, indentOf(line))));
}

/** An item's own line, without it reading as a list, heading or quote. */
const escapeLine = (text: string) => text.replace(/^(\d+)([.)])(?=\s)/, "$1\\$2").replace(/^([#>+*-])(?=\s)/, "\\$1");

function inlineOf(text: string, parse: Parse): unknown[] {
  const [first] = parse(escapeLine(text));
  return Array.isArray(first?.content) ? first.content : text ? [{ type: "text", text, styles: {} }] : [];
}

export function parseOutline(markdown: string, parse: Parse): LooseBlock[] {
  const lines = markdown.split("\n");
  const blocks: LooseBlock[] = [];
  let chunk: string[] = [];
  const flush = () => {
    if (chunk.some((line) => !isBlank(line))) blocks.push(...parse(chunk.join("\n")));
    chunk = [];
  };

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];

    if (FENCE.test(line)) {
      // Code keeps its lines as they are, list markers and all.
      const fence = line.trim().slice(0, 3);
      chunk.push(line.trimStart());
      for (i++; i < lines.length; i++) {
        chunk.push(lines[i]);
        if (lines[i].trim().startsWith(fence)) {
          i++;
          break;
        }
      }
      continue;
    }

    const item = indentOf(line) === 0 ? LIST_ITEM.exec(line) : null;
    if (!item) {
      // Left over indentation would read as a code block.
      chunk.push(line.trimStart());
      i++;
      continue;
    }

    flush();
    const body: string[] = [];
    for (i++; i < lines.length && (isBlank(lines[i]) || indentOf(lines[i]) > 0); i++) body.push(lines[i]);
    const children = parseOutline(dedent(body).join("\n"), parse);
    const [, marker, rest] = item;
    const check = /^[-*+]$/.test(marker) ? CHECK.exec(rest) : null;
    const text = check ? check[2] : rest;
    blocks.push({
      type: check ? "checkListItem" : /\d/.test(marker) ? "numberedListItem" : "bulletListItem",
      ...(check ? { props: { checked: check[1] !== " " } } : {}),
      content: inlineOf(text.trim(), parse),
      ...(children.length ? { children } : {}),
    });
  }
  flush();
  return blocks;
}

const LIST_TYPES = new Set(["bulletListItem", "numberedListItem", "checkListItem"]);

/**
 * A bullet holding more than a list (a paragraph, a picture, a heading, a
 * toggle...) was a toggle in Notion: a plain bullet can't hold those there.
 */
export function restoreToggles(blocks: LooseBlock[]): LooseBlock[] {
  return blocks.map((block) => {
    const children = block.children?.length ? restoreToggles(block.children) : undefined;
    const holdsMore = children?.some((child) => !LIST_TYPES.has(child.type));
    return {
      ...block,
      ...(children ? { children } : {}),
      ...(block.type === "bulletListItem" && holdsMore ? { type: "toggleListItem" } : {}),
    };
  });
}
