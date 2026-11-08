// Paths inside a Notion export. Files are named "Title <32 hex id>.md", a
// page's subpages live in a folder of the same name next to it, and links
// between files are relative and URL-encoded.

const NOTION_ID = /\s+[0-9a-f]{32}$/i;

export const dirname = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf("/")));
export const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);
export const withoutExtension = (path: string) => path.replace(/\.[^./]+$/, "");

/** "Plan de ventas 1a2b….md" → "Plan de ventas". */
export function titleFromName(name: string): string {
  return withoutExtension(name).replace(/_all$/, "").replace(NOTION_ID, "").trim() || "Sin título";
}

/** Resolves a link written inside `fromFile` to a path in the zip, or null for web links. */
export function resolveLink(fromFile: string, href: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(href.split("#")[0]);
  } catch {
    decoded = href;
  }
  const parts = dirname(fromFile) ? dirname(fromFile).split("/") : [];
  for (const part of decoded.split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/").normalize("NFC");
}
