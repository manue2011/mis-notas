// The shape of our custom blocks (type, props, content), without how they
// look. The editor's React specs and the real-time server's plain schema
// (realtime/schema.ts) are both built from these, so their documents match.

export const screenshotConfig = {
  type: "screenshot",
  propSchema: {
    url: { default: "" },
    assetId: { default: "" },
    width: { default: 0 },
    height: { default: 0 },
  },
  content: "inline",
} as const;

export const stickyNoteConfig = {
  type: "stickyNote",
  propSchema: {},
  content: "inline",
} as const;

export const pageLinkConfig = {
  type: "pageLink",
  propSchema: {
    pageId: { default: "" },
    title: { default: "" },
  },
  content: "none",
} as const;

export const CODE_BLOCK_DEFAULT_LANGUAGE = "typescript";
