// "Ordenar esta página": the page goes to the AI as Markdown and comes back
// as Markdown. What the AI must not rewrite (pictures, sticky notes, tables,
// code) travels as a marker line it may only move; links to other pages
// travel as Markdown links whose address is a marker; a toggle is a list item
// starting with TOGGLE, its contents indented under it. The AI may add
// sticky notes ("> [!nota] …") and ends its answer with what it changed.
// Pure functions, shared by the server action and the browser.

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
/** Separates the page from the list of what the AI changed in its answer. */
export const CHANGES_MARKER = "LIBRETACAMBIOS";
/** Starts a line the AI turned into a sticky note: "> [!nota] …". */
export const STICKY_TAG = "[!nota]";
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

const WEB_ADDRESS = /https?:\/\/[^\s<>()\]]+/g;

/** The web addresses in the text, unescaped and without a trailing "/" or "#". */
const webAddresses = (markdown: string) =>
  new Set(markdown.match(WEB_ADDRESS)?.map((url) => url.replace(/\\(?=[\\*_`[\]])/g, "").replace(/[/#]+$/, "")));

/** The text the AI wrote: no markers, and no web addresses (checked on their own: a link's text may change). */
const withoutMarkers = (markdown: string) =>
  markdown.replace(BLOCK_MARKER, " ").replace(/LIBRETAENLACE\d+X/g, " ").replace(WEB_ADDRESS, " ");

// Linking words a list or a heading naturally leaves out ("hay que llamar…" → "Llamar…").
const FILLER = new Set(
  (
    "que hay dice dicen comenta comentan primero luego despues entonces tambien pero para por con sin del los las " +
    "una uno unos unas este esta esto estos estas ese esa eso esos esas como cuando donde porque pues muy mas " +
    "ademas tiene tienen hace hacer sobre entre the and for with that this then also"
  ).split(" "),
);

/** Letters a word is compared by, so a rewritten sentence keeps its words ("pausará" → "pausa", "accedemos" → "acceder"). */
const STEM_LENGTH = 5;

/** Words that tell whether the AI kept the text (3+ letters, no filler), each with its stem: lowercase, no accents, cut short. */
function wordsAndStems(markdown: string): { word: string; stem: string }[] {
  return (withoutMarkers(markdown).normalize("NFC").match(/\p{L}{3,}/gu) ?? [])
    .map((word) => ({ word, plain: word.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase() }))
    .filter(({ plain }) => !FILLER.has(plain))
    .map(({ word, plain }) => ({ word, stem: plain.slice(0, STEM_LENGTH) }));
}

const words = (markdown: string) => wordsAndStems(markdown).map(({ stem }) => stem);

/**
 * The numbers in the text (dates, amounts, references): the data a tidier
 * page must keep. Enumerations ("1)", "2.", "2.3" starting a line, heading
 * or list item, bold or not) don't count, and 1.284 is 1284.
 */
function numbers(markdown: string): string[] {
  return (
    withoutMarkers(markdown)
      .replace(/^([ \t]*(?:#{1,6}[ \t]+|[-*+][ \t]+|>[ \t]*|\*\*)*)\d{1,2}(?:(?:\.\d{1,2})+\.?|[.)])(?=[\s*])/gm, "$1")
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

/** The page's different words that aren't there any more; a word with a typo fixed ("empelado") is. */
function lostWords(before: string[], after: string[]): string[] {
  const there = new Set(after);
  return [...new Set(before)].filter(
    (word) => !there.has(word) && !(word.length === STEM_LENGTH && [...there].some((other) => closeTo(word, other, 1))),
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

export type TidyCheck =
  | {
      ok: true;
      markdown: string;
      /** Words of the page the answer may have left out, to point out (empty when it kept nearly all). */
      missing: string[];
    }
  | { ok: false; reason: "dropped" | "invented" | "empty" };

/** The AI's answer: the page, then CHANGES_MARKER and a short list of what it changed. */
export function splitTidyAnswer(answer: string): { page: string; changes: string[] } {
  const at = answer.search(CHANGES_LINE);
  if (at < 0) return { page: answer, changes: [] };
  const changes = answer
    .slice(at)
    .split("\n")
    .slice(1)
    .map((line) => line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").replace(/[*_`]/g, "").trim())
    .filter((line) => line && !line.includes("LIBRETA"))
    .slice(0, MAX_CHANGES)
    .map((line) => (line.length > MAX_CHANGE_LENGTH ? `${line.slice(0, MAX_CHANGE_LENGTH - 1)}…` : line));
  return { page: answer.slice(0, at), changes };
}

const CHANGES_LINE = new RegExp(`^[ \\t*_#]*${CHANGES_MARKER}[ \\t*_:]*$`, "m");
const MAX_CHANGES = 5;
const MAX_CHANGE_LENGTH = 200;

/** A sticky note the AI wrote: "> [!nota] …" (STICKY_TAG). */
const STICKY_LINE = /^[ \t]*>[ \t]*\[!nota\]/i;

/**
 * Sticky notes the AI wrote, each on one line between blank lines. A note
 * that only repeats a line the page still has is dropped: the AI was asked
 * to move warnings into notes, and sometimes copies them instead.
 */
function tidyNotes(markdown: string): string {
  const lines = markdown
    // "> [!nota]" alone, with the warning on the next "> " line.
    .replace(/^([ \t]*>[ \t]*\[!nota\])[ \t]*\n[ \t]*>[ \t]?/gim, "$1 ")
    .split("\n");
  const others = lines.filter((line) => !STICKY_LINE.test(line)).map((line) => new Set(words(line)));
  return lines
    .flatMap((line) => {
      if (!STICKY_LINE.test(line)) return [line];
      const note = [...new Set(words(line.replace(STICKY_LINE, "")))];
      const repeated =
        note.length >= 3 && others.some((other) => note.filter((word) => other.has(word)).length >= note.length * 0.8);
      return repeated ? [] : ["", line, ""];
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Share of the page's different words the answer must keep (grouping drops
 * repeats like a name). Below WARN the words it left out are pointed out.
 */
const MIN_DISTINCT_KEPT = 0.7;
const WARN_DISTINCT_KEPT = 0.85;
const MAX_MISSING_SHOWN = 12;
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
    // The header of the message it was sent (tidyUserMessage), echoed back.
    .replace(/^[ \t#*_]*t[ií]tulo de la p[aá]gina:[^\n]*\n*/i, "")
    .trim();
  if (!markdown) return { ok: false, reason: "empty" };

  const seen = new Set<string>();
  markdown = markdown.replace(BLOCK_MARKER, (marker) => {
    if (!source.blocks.has(marker) || seen.has(marker)) return "";
    seen.add(marker);
    return marker;
  });
  const markersLeftOut = [...source.blocks.keys()].filter((marker) => !seen.has(marker));
  if (markersLeftOut.length) markdown += `\n\n${markersLeftOut.join("\n\n")}`;
  markdown = tidyNotes(ownLines(markdown)).trim();

  // Trailing spaces would read as line breaks.
  markdown = markdown.replace(/[ \t]+$/gm, "");

  const sourceWords = wordsAndStems(source.markdown);
  const before = sourceWords.map(({ stem }) => stem);
  const after = words(markdown);
  const lost = lostWords(before, after);
  const distinctKept = before.length ? 1 - lost.length / new Set(before).size : 1;
  const [numbersBefore, numbersAfter] = [numbers(source.markdown), numbers(markdown)];
  const long = (n: string) => n.length > 1;
  const short = (n: string) => n.length === 1;
  const addresses = webAddresses(markdown);
  const dropped =
    [...webAddresses(source.markdown)].some((url) => !addresses.has(url)) ||
    distinctKept < MIN_DISTINCT_KEPT ||
    keptShare(before, after) < MIN_ALL_KEPT ||
    keptShare(numbersBefore.filter(long), numbersAfter.filter(long)) < MIN_NUMBERS_KEPT ||
    countMissing(numbersBefore.filter(short), numbersAfter.filter(short)) > digitsMayGo(numbersBefore.filter(short).length);
  if (dropped) return { ok: false, reason: "dropped" };
  if (after.length > before.length * MAX_GROWTH + 40) return { ok: false, reason: "invented" };
  const lostSet = new Set(distinctKept < WARN_DISTINCT_KEPT ? lost : []);
  const missing = [
    ...new Set(sourceWords.filter(({ stem }) => lostSet.has(stem)).map(({ word }) => word.toLowerCase())),
  ].slice(0, MAX_MISSING_SHOWN);
  return { ok: true, markdown, missing };
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
