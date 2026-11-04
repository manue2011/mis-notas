"use client";

import { createReactInlineContentSpec } from "@blocknote/react";
import { pageLinkConfig } from "../block-configs";
import { PageLink } from "./PageLink";

/**
 * A link to another page of the workspace, inserted with "@". It stores the
 * page id (and the title at the time, in case the page is later deleted) and
 * shows the page's current title.
 */
export const pageLinkInline = createReactInlineContentSpec(
  pageLinkConfig,
  {
    render: ({ inlineContent }) => (
      <PageLink pageId={inlineContent.props.pageId} savedTitle={inlineContent.props.title} />
    ),
  },
);
