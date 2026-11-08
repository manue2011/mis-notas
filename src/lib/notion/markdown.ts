import { resolveLink } from "./paths";

// Gets a Notion page's Markdown ready for BlockNote's parser. What it can't
// turn into our blocks (images, callouts) is swapped for a marker paragraph,
// then replaced once parsed (see blocks.ts).

export type ImageRef = { marker: string; path: string; alt: string };
export type CalloutRef = { marker: string; text: string };
export type PreparedPage = { title: string | null; markdown: string; images: ImageRef[]; callouts: CalloutRef[] };

/** Letters and digits only, so the Markdown parser leaves it alone. */
export const markerFor = (kind: "IMG" | "NOTE", n: number) => `NOTIONIMPORT${kind}${n}X`;

const stripTags = (html: string) => html.replace(/<[^>]+>/g, "");
// A callout starts with its icon (an emoji): our sticky notes don't have one.
const leadingIcon = /^[\p{Extended_Pictographic}\p{Emoji_Modifier}️‍\s]+/u;

export function prepareMarkdown(source: string, file: string): PreparedPage {
  let markdown = source.replace(/\r\n?/g, "\n");
  let title: string | null = null;
  const heading = markdown.match(/^\s*# (.+)\n?/);
  if (heading) {
    title = heading[1].trim();
    markdown = markdown.slice(heading[0].length);
  }

  const callouts: CalloutRef[] = [];
  markdown = markdown.replace(/<aside>([\s\S]*?)<\/aside>/g, (_, inner: string) => {
    const marker = markerFor("NOTE", callouts.length);
    const text = stripTags(inner)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ")
      .replace(leadingIcon, "");
    callouts.push({ marker, text });
    return `\n\n${marker}\n\n`;
  });

  const images: ImageRef[] = [];
  markdown = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (whole, alt: string, href: string) => {
    const path = resolveLink(file, href.trim());
    // Pictures on the web: we can't copy them, so keep a link to them.
    if (!path) return `[${alt || "Imagen"}](${href})`;
    const marker = markerFor("IMG", images.length);
    images.push({ marker, path, alt });
    return `\n\n${marker}\n\n`;
  });

  // There's no table block: each row becomes a list item, cells joined by "·",
  // so none of the text is lost.
  markdown = markdown.replace(/(?:^\|.*\|[ \t]*(?:\n|$))+/gm, (table) => {
    const rows = table
      .trim()
      .split("\n")
      .filter((row) => !/^\|[\s:|-]+\|$/.test(row.trim()))
      .map((row) =>
        row
          .trim()
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean)
          .join(" · "),
      )
      .filter(Boolean);
    return `\n${rows.map((row) => `- ${row}`).join("\n")}\n\n`;
  });

  // Toggles come as <details>: keep the summary (bold) and what's inside.
  markdown = markdown
    .replace(/<summary>([\s\S]*?)<\/summary>/g, (_, text: string) => `**${stripTags(text).trim()}**\n\n`)
    .replace(/<\/?details>/g, "\n");

  return { title, markdown, images, callouts };
}
