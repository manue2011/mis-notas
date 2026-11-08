"use client";

import { BlockNoteEditor } from "@blocknote/core";
import { pageSchema } from "@/components/page/editor/schema";
import { uploadImage, UploadError } from "@/lib/assets/upload-client";
import { savePageContentAction } from "@/lib/pages/actions";
import { MAX_TITLE_LENGTH } from "@/lib/pages/content";
import { createImportedPagesAction } from "./actions";
import { databaseBlocks, finishBlocks, text, type LooseBlock, type PageTarget } from "./blocks";
import { parseCsv } from "./csv";
import { prepareMarkdown } from "./markdown";
import { basename, resolveLink, withoutExtension } from "./paths";
import { buildTree, type NotionEntry } from "./tree";
import { unzipExport } from "./unzip";

// Runs a whole Notion import in the browser: the zip never goes to our
// server, only the pages (through the same actions as normal editing) and
// the images (signed uploads to Cloudinary, like a pasted screenshot).

export type NotionProgress =
  | { phase: "unzipping" }
  | { phase: "creating"; total: number }
  | { phase: "filling"; done: number; total: number; images: number };

export type NotionResult = { pages: number; images: number; warnings: string[]; firstPageId: string | null };

export class NotionImportError extends Error {}

export const MAX_ZIP_BYTES = 300 * 1024 * 1024;
const MAX_PAGES = 2000;
const BATCH = 100;
const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

const decoder = new TextDecoder();

export async function runNotionImport(
  zip: File,
  organizationId: string,
  onProgress: (progress: NotionProgress) => void,
): Promise<NotionResult> {
  if (zip.size > MAX_ZIP_BYTES) throw new NotionImportError("El zip pesa más de 300 MB. Exporta las páginas por partes.");

  onProgress({ phase: "unzipping" });
  const files = await unzipExport(new Uint8Array(await zip.arrayBuffer())).catch(() => {
    throw new NotionImportError("No hemos podido abrir el zip. ¿Es la exportación tal cual la descarga Notion?");
  });
  const read = (file: string) => decoder.decode(files.get(file));
  const entries = buildTree(files, read);
  if (entries.length === 0) {
    throw new NotionImportError("Este zip no tiene páginas de Notion. Exporta con el formato «Markdown & CSV».");
  }
  if (entries.length > MAX_PAGES) {
    throw new NotionImportError(`El zip tiene ${entries.length} páginas; el máximo son ${MAX_PAGES}. Expórtalo por partes.`);
  }

  // 1. Every page, empty, parents first, so links between them can be resolved.
  onProgress({ phase: "creating", total: entries.length });
  const ids = new Map<string, string>();
  for (let depth = 0; ; depth++) {
    const level = entries.filter((entry) => entry.depth === depth);
    if (level.length === 0) break;
    for (let i = 0; i < level.length; i += BATCH) {
      const batch = level.slice(i, i + BATCH);
      const result = await createImportedPagesAction(
        organizationId,
        batch.map((entry) => ({
          title: entry.title.slice(0, MAX_TITLE_LENGTH),
          parentId: entry.parentKey ? (ids.get(entry.parentKey) ?? null) : null,
        })),
      );
      if (!result.ok) throw new NotionImportError(result.error);
      batch.forEach((entry, j) => ids.set(entry.key, result.ids[j]));
    }
  }

  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const targetFor = (key: string): PageTarget | null => {
    const entry = byKey.get(key);
    const pageId = ids.get(key);
    return entry && pageId ? { pageId, title: entry.title } : null;
  };

  // 2. Their content, one page at a time.
  const editor = BlockNoteEditor.create({ schema: pageSchema });
  const warnings: string[] = [];
  let images = 0;
  let done = 0;
  for (const entry of entries) {
    onProgress({ phase: "filling", done, total: entries.length, images });
    const pageId = ids.get(entry.key)!;
    try {
      const blocks =
        entry.kind === "database"
          ? databaseFor(entry, read, entries, targetFor)
          : await pageFor(entry, { read, files, editor, organizationId, pageId, targetFor, warnings, onImage: () => images++ });
      if (blocks.length) {
        const saved = await savePageContentAction(organizationId, pageId, blocks);
        if (!saved.ok) warnings.push(`«${entry.title}»: ${saved.error}`);
      }
    } catch (error) {
      console.error("[notion]", entry.file, error);
      warnings.push(`«${entry.title}» se ha creado vacía: no hemos podido leer su contenido.`);
    }
    done++;
  }
  onProgress({ phase: "filling", done, total: entries.length, images });

  return { pages: entries.length, images, warnings, firstPageId: ids.get(entries[0].key) ?? null };
}

/** A database: a list of its rows, linked to their pages (its subpages). */
function databaseFor(
  entry: NotionEntry,
  read: (file: string) => string,
  entries: NotionEntry[],
  targetFor: (key: string) => PageTarget | null,
): LooseBlock[] {
  const rows = parseCsv(read(entry.file));
  const rowPages = entries.filter((e) => e.parentKey === entry.key);
  return databaseBlocks(rows, (name) => {
    const row = rowPages.find((e) => e.title === name);
    return row ? targetFor(row.key) : null;
  });
}

type PageContext = {
  read: (file: string) => string;
  files: Map<string, Uint8Array>;
  editor: BlockNoteEditor<typeof pageSchema.blockSchema, typeof pageSchema.inlineContentSchema, typeof pageSchema.styleSchema>;
  organizationId: string;
  pageId: string;
  targetFor: (key: string) => PageTarget | null;
  warnings: string[];
  onImage: () => void;
};

async function pageFor(entry: NotionEntry, ctx: PageContext): Promise<LooseBlock[]> {
  const prepared = prepareMarkdown(ctx.read(entry.file), entry.file);
  const parsed = ctx.editor.tryParseMarkdownToBlocks(prepared.markdown) as unknown as LooseBlock[];

  const markers = new Map<string, LooseBlock | null>();
  for (const callout of prepared.callouts) {
    markers.set(callout.marker, callout.text ? { type: "stickyNote", content: [text(callout.text)] } : null);
  }
  for (const image of prepared.images) {
    markers.set(image.marker, await imageBlock(image.path, image.alt, entry, ctx));
  }

  return finishBlocks(parsed, {
    replaceMarker: (marker) => markers.get(marker),
    linkTarget: (href) => {
      const path = resolveLink(entry.file, href);
      if (!path || !/\.(md|csv)$/i.test(path)) return null;
      return ctx.targetFor(withoutExtension(path).replace(/_all$/, ""));
    },
  });
}

async function imageBlock(path: string, alt: string, entry: NotionEntry, ctx: PageContext): Promise<LooseBlock> {
  const name = basename(path);
  const missing = (why: string): LooseBlock => {
    ctx.warnings.push(`«${entry.title}»: la imagen ${name} ${why}.`);
    return { type: "paragraph", content: [text(`(Imagen sin importar: ${name})`)] };
  };
  const bytes = ctx.files.get(path);
  const type = IMAGE_TYPES[name.split(".").pop()?.toLowerCase() ?? ""];
  if (!bytes) return missing("no está en el zip");
  if (!type) return missing("tiene un formato que no admitimos");

  try {
    const uploaded = await uploadImage(new File([new Uint8Array(bytes)], name, { type }), ctx, () => {});
    ctx.onImage();
    // Notion fills alt with the file name; that's no caption.
    const caption = alt && !/\.(png|jpe?g|gif|webp)$/i.test(alt) && alt !== "Untitled" ? alt : "";
    return {
      type: "screenshot",
      props: { url: uploaded.url, assetId: uploaded.assetId, width: uploaded.width, height: uploaded.height },
      content: caption ? [text(caption)] : [],
    };
  } catch (error) {
    return missing(error instanceof UploadError ? `no se ha podido subir (${error.message})` : "no se ha podido subir");
  }
}
