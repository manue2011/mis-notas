import {
  BlockNoteSchema,
  createCodeBlockSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  type BlockNoteEditor,
} from "@blocknote/core";
import { es } from "@blocknote/core/locales";
import { codeBlockOptions } from "@blocknote/code-block";
import { screenshotBlock } from "./blocks/ScreenshotBlock";
import { stickyNoteBlock } from "./blocks/StickyNoteBlock";
import { pageLinkInline } from "./inline/PageLinkInline";

// Keep in sync with PAGE_BLOCK_TYPES in src/lib/pages/content.ts, which the
// server validates against.
export const pageSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    heading: defaultBlockSpecs.heading,
    bulletListItem: defaultBlockSpecs.bulletListItem,
    numberedListItem: defaultBlockSpecs.numberedListItem,
    checkListItem: defaultBlockSpecs.checkListItem,
    quote: defaultBlockSpecs.quote,
    codeBlock: createCodeBlockSpec({ ...codeBlockOptions, defaultLanguage: "typescript" }),
    screenshot: screenshotBlock,
    stickyNote: stickyNoteBlock,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    pageLink: pageLinkInline,
  },
});

export type PageEditor = BlockNoteEditor<
  typeof pageSchema.blockSchema,
  typeof pageSchema.inlineContentSchema,
  typeof pageSchema.styleSchema
>;

export type PageBlock = (typeof pageSchema)["PartialBlock"];

export const pageDictionary = {
  ...es,
  placeholders: {
    ...es.placeholders,
    default: "Escribe / para insertar un bloque",
    emptyDocument: "Escribe aquí, o / para insertar un bloque",
    bulletListItem: "Elemento",
    numberedListItem: "Elemento",
    checkListItem: "Tarea",
    // screenshot and stickyNote hints live in notebook-editor.css.
  },
};
