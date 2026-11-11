import {
  BlockNoteSchema,
  createBlockSpec,
  createCodeBlockSpec,
  createInlineContentSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core";
import {
  CODE_BLOCK_DEFAULT_LANGUAGE,
  pageLinkConfig,
  screenshotConfig,
  stickyNoteConfig,
} from "@/components/page/editor/block-configs";

// The editor's schema (src/components/page/editor/schema.ts) without React:
// the same block shapes, so documents convert the same way, but no UI code
// (and none of its imports) on the server. Rendering never runs here.

const shell = () => {
  const dom = document.createElement("div");
  return { dom, contentDOM: dom };
};

export const serverPageSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    heading: defaultBlockSpecs.heading,
    bulletListItem: defaultBlockSpecs.bulletListItem,
    numberedListItem: defaultBlockSpecs.numberedListItem,
    checkListItem: defaultBlockSpecs.checkListItem,
    toggleListItem: defaultBlockSpecs.toggleListItem,
    quote: defaultBlockSpecs.quote,
    table: defaultBlockSpecs.table,
    codeBlock: createCodeBlockSpec({ defaultLanguage: CODE_BLOCK_DEFAULT_LANGUAGE }),
    screenshot: createBlockSpec(screenshotConfig, { render: shell })(),
    stickyNote: createBlockSpec(stickyNoteConfig, { render: shell })(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    pageLink: createInlineContentSpec(pageLinkConfig, { render: () => ({ dom: document.createElement("span") }) }),
  },
});
