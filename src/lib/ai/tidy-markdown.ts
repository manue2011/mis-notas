// "Ordenar esta página": the page goes to the AI as Markdown and comes back
// as Markdown. What the AI must not rewrite (pictures, sticky notes, tables,
// code) travels as a marker line it may only move; links to other pages
// travel as Markdown links whose address is a marker; a toggle is a list item
// starting with TOGGLE, its contents indented under it. Pure functions,
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
/** Starts a toggle's line: "- ▸ Title". */
export const TOGGLE = "▸ ";

const LIST_TYPES = new Set(["bulletListItem", "numberedListItem", "checkListItem", "toggleListItem"]);
const TEXT_TYPES = new Set([...LIST_TYPES, "paragraph", "heading", "quote"]);

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

/** What starts a block's line: "## ", "- ", "3. ", "- [x] ", "- ▸ ", "> " or nothing. */
function linePrefix(block: TidyBlock, numbered: number): string {
  switch (block.type) {
    case "heading":
      return `${"#".repeat(Math.min(Math.max(Number(block.props?.level) || 1, 1), 3))} `;
    case "bulletListItem":
      return "- ";
    case "toggleListItem":
      return `- ${TOGGLE}`;
    case "numberedListItem":
      return `${numbered}. `;
    case "checkListItem":
      return `- [${block.props?.checked ? "x" : " "}] `;
    case "quote":
      return "> ";
    default:
      return "";
  }
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
      const prefix = linePrefix(block, numbered);
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
 * page must keep. Enumerations ("1)", "2." starting a line, heading or list
 * item) don't count, and 1.284 is 1284.
 */
function numbers(markdown: string): string[] {
  return (
    withoutMarkers(markdown)
      .replace(/^([ \t]*(?:#{1,6}[ \t]+|[-*+][ \t]+|>[ \t]*)*)\d{1,2}[.)](?=\s)/gm, "$1")
      .match(/\d+(?:[.,]\d+)*/g)
      ?.map((n) => n.replace(/[.,]/g, "")) ?? []
  );
}

/** At most `max` single-letter edits apart (a typo the AI fixed). */
function closeTo(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    if (Math.min(...row) > max) return false;
    previous = row;
  }
  return previous[b.length] <= max;
}

/** Share of the page's different words still there, a word with a typo fixed included. */
function distinctKept(before: string[], after: string[]): number {
  const unique = [...new Set(before)];
  if (!unique.length) return 1;
  const there = new Set(after);
  const kept = unique.filter(
    (word) => there.has(word) || (word.length >= 5 && [...there].some((other) => closeTo(word, other, 2))),
  );
  return kept.length / unique.length;
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
      const bare = line
        // A marker the AI made a list item, heading or quote of…
        .replace(/^[ \t]*(?:[-*+]|\d+[.)]|#{1,6}|>)[ \t]+(?=[`*_]*LIBRETABLOQUE\d+X)/, indent)
        // …or wrapped in code, bold or italics.
        .replace(/[`*_]+(LIBRETABLOQUE\d+X)[`*_]+/g, "$1");
      return bare
        .split(/(LIBRETABLOQUE\d+X)/)
        .map((part) => part.trim())
        .filter((part) => part && !/^[`*_]+$/.test(part))
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
/** Share of its numbers of two or more digits (dates, amounts, codes), repeats included. */
const MIN_NUMBERS_KEPT = 0.98;
/** Single digits are often counts the AI writes out ("3 ficheros" → "tres ficheros"): one may go, or a quarter. */
const digitsMayGo = (count: number) => Math.max(1, Math.floor(count / 4));
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
  const [numbersBefore, numbersAfter] = [numbers(source.markdown), numbers(markdown)];
  const long = (n: string) => n.length > 1;
  const short = (n: string) => n.length === 1;
  const dropped =
    distinctKept(before, after) < MIN_DISTINCT_KEPT ||
    keptShare(before, after) < MIN_ALL_KEPT ||
    keptShare(numbersBefore.filter(long), numbersAfter.filter(long)) < MIN_NUMBERS_KEPT ||
    countMissing(numbersBefore.filter(short), numbersAfter.filter(short)) > digitsMayGo(numbersBefore.filter(short).length);
  if (dropped) return { ok: false, reason: "dropped" };
  if (after.length > before.length * MAX_GROWTH + 40) return { ok: false, reason: "invented" };
  return { ok: true, markdown };
}

/** How much of `before` is still in `after`, counting repeats (a line written twice must stay twice). */
function keptShare(before: string[], after: string[]): number {
  if (!before.length) return 1;
  return (before.length - countMissing(before, after)) / before.length;
}

/** How many of `before` aren't in `after`, counting repeats. */
function countMissing(before: string[], after: string[]): number {
  const left = new Map<string, number>();
  for (const word of after) left.set(word, (left.get(word) ?? 0) + 1);
  let lost = 0;
  for (const word of before) {
    const n = left.get(word) ?? 0;
    if (n > 0) left.set(word, n - 1);
    else lost++;
  }
  return lost;
}
