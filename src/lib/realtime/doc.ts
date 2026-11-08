// How a page lives inside its Yjs document (the document's name is the page id).
// Shared by the editor and the real-time server.

/** BlockNote's blocks. */
export const CONTENT_FRAGMENT = "blocks";
/** The page title, as plain collaborative text. */
export const TITLE_TEXT = "title";

/** Refusal reason sent when the server can't load the page (as opposed to no access). */
export const PAGE_UNAVAILABLE = "page-unavailable";
