import { resolveLink } from "./paths";

// Gets a Notion page's Markdown ready for parsing (see outline.ts). What it
// can't turn into our blocks (images, callouts) is swapped for a marker
// paragraph, then replaced once parsed (see blocks.ts).

export type ImageRef = { marker: string; path: string; alt: string };
export type CalloutRef = { marker: string; text: string };
export type PreparedPage = { title: string | null; markdown: string; images: ImageRef[]; callouts: CalloutRef[] };

/** Letters and digits only, so the Markdown parser leaves it alone. */
export const markerFor = (kind: "IMG" | "NOTE", n: number) => `NOTIONIMPORT${kind}${n}X`;

const stripTags = (html: string) => html.replace(/<[^>]+>/g, "");
// A callout starts with its icon (an emoji): our sticky notes don't have one.
const leadingIcon = /^[\p{Extended_Pictographic}\p{Emoji_Modifier}️‍\s]+/u;

/**
 * A marker on a line of its own, indented like the line it was found in,
 * so it stays inside the toggle or list item it belongs to.
 */
function ownLine(markdown: string, offset: number, marker: string): string {
  const lineStart = markdown.lastIndexOf("\n", offset - 1) + 1;
  const indent = /^[ \t]*/.exec(markdown.slice(lineStart))![0];
  return `\n\n${indent}${marker}\n\n${indent}`;
}

export function prepareMarkdown(source: string, file: string): PreparedPage {
  let markdown = source.replace(/\r\n?/g, "\n");
  let title: string | null = null;
  const heading = markdown.match(/^\s*# (.+)\n?/);
  if (heading) {
    title = heading[1].trim();
    markdown = markdown.slice(heading[0].length);
  }

  const callouts: CalloutRef[] = [];
  markdown = markdown.replace(/<aside>([\s\S]*?)<\/aside>/g, (_, inner: string, offset: number, whole: string) => {
    const marker = markerFor("NOTE", callouts.length);
    const text = stripTags(inner)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ")
      .replace(leadingIcon, "");
    callouts.push({ marker, text });
    return ownLine(whole, offset, marker);
  });

  const images: ImageRef[] = [];
  markdown = markdown.replace(
    // Notion leaves parentheses in file names unescaped: image_(2).png.
    /!\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g,
    (_, alt: string, href: string, offset: number, whole: string) => {
      const path = resolveLink(file, href.trim());
      // Pictures on the web: we can't copy them, so keep a link to them.
      if (!path) return `[${alt || "Imagen"}](${href})`;
      const marker = markerFor("IMG", images.length);
      images.push({ marker, path, alt });
      return ownLine(whole, offset, marker);
    },
  );

  // Toggles exported as <details>: the summary becomes a list item with the
  // rest indented under it, which outline.ts turns back into a toggle.
  markdown = markdown.replace(
    /<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g,
    (_, summary: string, inner: string) =>
      `\n- ${stripTags(summary).trim()}\n\n${inner
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n")}\n\n`,
  );

  return { title, markdown, images, callouts };
}
