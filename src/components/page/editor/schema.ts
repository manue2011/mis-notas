import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { es } from "@blocknote/core/locales";

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
  },
});

export const pageDictionary = {
  ...es,
  placeholders: {
    ...es.placeholders,
    default: "Escribe / para insertar un bloque",
    emptyDocument: "Escribe aquí, o / para insertar un bloque",
    bulletListItem: "Elemento",
    numberedListItem: "Elemento",
    checkListItem: "Tarea",
  },
};
