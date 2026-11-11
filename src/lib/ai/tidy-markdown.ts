// "Ordenar esta página": the page goes to the AI as Markdown and comes back
// as Markdown. What the AI must not rewrite (pictures, sticky notes, tables,
// code, toggles) travels as a marker line it may only move; links to other
// pages travel as Markdown links whose address is a marker. Pure functions,
// shared by the server action and the browser.

type Inline = {
  type: string;
  text?: string;
  styles?: Record<string, unknown>;
  href?: string;
  content?: Inline[];
  props?: Record<string, unknown>;
};

export type TidyBlock = {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: TidyBlock[];
};

export type TidySource = {
  markdown: string;
  /** Marker → the block it stands for, children included. */
  blocks: Map<string, TidyBlock>;
  /** Marker → the page link it stands for. */
  links: Map<string, Inline>;
};

/** Letters and digits only, so the Markdown parser leaves them alone. */
export const blockMarker = (n: number) => `LIBRETABLOQUE${n}X`;
export const linkMarker = (n: number) => `LIBRETAENLACE${n}X`;
export const BLOCK_MARKER = /LIBRETABLOQUE\d+X/g;

const TEXT_TYPES = new Set(["paragraph", "heading", "bulletListItem", "numberedListItem", "checkListItem", "quote"]);
const LIST_TYPES = new Set(["bulletListItem", "numberedListItem", "checkListItem"]);

const escapeText = (text: string) => text.replace(/([\\*_`[\]])/g, "\\$1");
/** A line that would read as a heading, quote or list item when it isn't one. */
const escapeStart = (line: string) =>
  line.replace(/^(\s*)(\d+)([.)])(?=\s)/, "$1$2\\$3").replace(/^(\s*)([#>+-])(?=\s)/, "$1\\$2");

function styled(text: string, styles: Record<string, unknown> = {}): string {
  if (!text) return "";
  if (styles.code) return `\`${text.replace(/`/g, "")}\``;
  // Markdown wraps the words, not the spaces around them.
  const [, lead, core, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)!;
  if (!core) return text;
  let out = escapeText(core);
  if (styles.bold) out = `**${out}**`;
  if (styles.italic) out = `*${out}*`;
  if (styles.strike) out = `~~${out}~~`;
  return lead + out + trail;
}

function inlineMarkdown(items: unknown, links: Map<string, Inline>): string {
  if (!Array.isArray(items)) return "";
  return (items as Inline[])
    .map((item) => {
      if (item.type === "text") return styled(item.text ?? "", item.styles);
      if (item.type === "link") return `[${inlineMarkdown(item.content, links)}](${item.href ?? ""})`;
      if (item.type === "pageLink") {
        const marker = linkMarker(links.size);
        links.set(marker, item);
        const title = typeof item.props?.title === "string" && item.props.title ? item.props.title : "página";
        return `[${escapeText(title)}](${marker})`;
      }
      return "";
    })
    .join("")
    .replace(/\n/g, " ");
}

/** The page as Markdown, with markers for what the AI must keep as it is. */
export function toTidyMarkdown(document: TidyBlock[]): TidySource {
  const blocks = new Map<string, TidyBlock>();
  const links = new Map<string, Inline>();
  const lines: string[] = [];
  let numbered = 0;

  const write = (list: TidyBlock[], indent: string) => {
    for (const block of list) {
      numbered = block.type === "numberedListItem" ? numbered + 1 : 0;
      if (!TEXT_TYPES.has(block.type)) {
        const marker = blockMarker(blocks.size);
        blocks.set(marker, block);
        lines.push(`${indent}${marker}`, "");
        continue;
      }
      const text = inlineMarkdown(block.content, links);
      const level = Number(block.props?.level) || 1;
      const prefix =
        block.type === "heading"
          ? `${"#".repeat(Math.min(Math.max(level, 1), 3))} `
          : block.type === "bulletListItem"
            ? "- "
            : block.type === "numberedListItem"
              ? `${numbered}. `
              : block.type === "checkListItem"
                ? `- [${block.props?.checked ? "x" : " "}] `
                : block.type === "quote"
                  ? "> "
                  : "";
      // A list ends with a blank line before whatever follows it.
      if (!LIST_TYPES.has(block.type) && lines.length && lines[lines.length - 1] !== "") lines.push("");
      lines.push(indent + prefix + (prefix ? text : escapeStart(text)));
      const children = block.children ?? [];
      if (LIST_TYPES.has(block.type)) {
        if (children.length) write(children, `${indent}    `);
      } else {
        lines.push("");
        // Only list items nest in Markdown; anything else's children follow it.
        if (children.length) write(children, indent);
      }
    }
  };
  write(document, "");
  if (lines.length) lines.push("");
  // Consecutive list items stay together; one blank line elsewhere.
  const markdown = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { markdown, blocks, links };
}

const withoutMarkers = (markdown: string) =>
  markdown.replace(BLOCK_MARKER, " ").replace(/LIBRETAENLACE\d+X/g, " ");

// Linking words a list or a heading naturally leaves out ("hay que llamar…" → "Llamar…").
const FILLER = new Set(
  (
    "que hay dice dicen comenta comentan primero luego despues entonces tambien pero para por con sin del los las " +
    "una uno unos unas este esta esto estos estas ese esa eso esos esas como cuando donde porque pues muy mas " +
    "ademas tiene tienen hace hacer sobre entre the and for with that this then also"
  ).split(" "),
);

/** Words that tell whether the AI kept the text: 3+ letters, lowercase, no accents, no filler. */
function words(markdown: string): string[] {
  return (
    withoutMarkers(markdown)
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .match(/\p{L}{3,}/gu)
      ?.filter((word) => !FILLER.has(word)) ?? []
  );
}

/**
 * The numbers in the text (dates, amounts, references): the data a tidier
 * page must keep. List numbering doesn't count, and 1.284 is 1284.
 */
function numbers(markdown: string): string[] {
  return (
    withoutMarkers(markdown)
      .replace(/^[ \t]*\d+[.)][ \t]/gm, "")
      .match(/\d+(?:[.,]\d+)*/g)
      ?.map((n) => n.replace(/[.,]/g, "")) ?? []
  );
}

/**
 * Each marker alone on its line, between blank lines and indented like the
 * line it was in (so it stays in its list item): only a paragraph holding
 * nothing but the marker is swapped back for its block.
 */
function ownLines(markdown: string): string {
  return markdown
    .split("\n")
    .flatMap((line) => {
      if (!line.includes("LIBRETABLOQUE")) return [line];
      const indent = /^[ \t]*/.exec(line)![0];
      // A marker the AI made a list item, heading or quote of.
      const bare = line.replace(/^[ \t]*(?:[-*+]|\d+[.)]|#{1,6}|>)[ \t]+(?=LIBRETABLOQUE\d+X)/, indent);
      return bare
        .split(/(LIBRETABLOQUE\d+X)/)
        .map((part) => part.trim())
        .filter(Boolean)
        .flatMap((part) => ["", indent + part, ""]);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type TidyCheck = { ok: true; markdown: string } | { ok: false; reason: "dropped" | "invented" | "empty" };

/** Share of the page's different words the answer must keep (grouping drops repeats like a name). */
const MIN_DISTINCT_KEPT = 0.85;
/** Share of all its words, repeats included: catches a page cut down to one of each. */
const MIN_ALL_KEPT = 0.5;
/** Share of its numbers, repeats included. */
const MIN_NUMBERS_KEPT = 0.98;
/** How much longer it may get (headings). */
const MAX_GROWTH = 1.6;

/**
 * Checks the AI's answer against the page it was given and repairs what it
 * safely can: a marker it left out goes back at the end, a repeated one is
 * kept only where it first appears.
 */
export function checkTidyMarkdown(source: TidySource, answer: string): TidyCheck {
  let markdown = answer
    .trim()
    .replace(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i, "$1")
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!markdown) return { ok: false, reason: "empty" };

  const seen = new Set<string>();
  markdown = markdown.replace(BLOCK_MARKER, (marker) => {
    if (!source.blocks.has(marker) || seen.has(marker)) return "";
    seen.add(marker);
    return marker;
  });
  const missing = [...source.blocks.keys()].filter((marker) => !seen.has(marker));
  if (missing.length) markdown += `\n\n${missing.join("\n\n")}`;
  markdown = ownLines(markdown);

  // Trailing spaces would read as line breaks.
  markdown = markdown.replace(/[ \t]+$/gm, "");

  const before = words(source.markdown);
  const after = words(markdown);
  const dropped =
    keptShare([...new Set(before)], [...new Set(after)]) < MIN_DISTINCT_KEPT ||
    keptShare(before, after) < MIN_ALL_KEPT ||
    keptShare(numbers(source.markdown), numbers(markdown)) < MIN_NUMBERS_KEPT;
  if (dropped) return { ok: false, reason: "dropped" };
  if (after.length > before.length * MAX_GROWTH + 40) return { ok: false, reason: "invented" };
  return { ok: true, markdown };
}

/** How much of `before` is still in `after`, counting repeats (a line written twice must stay twice). */
function keptShare(before: string[], after: string[]): number {
  if (!before.length) return 1;
  const left = new Map<string, number>();
  for (const word of after) left.set(word, (left.get(word) ?? 0) + 1);
  let kept = 0;
  for (const word of before) {
    const n = left.get(word) ?? 0;
    if (n > 0) {
      kept++;
      left.set(word, n - 1);
    }
  }
  return kept / before.length;
}
