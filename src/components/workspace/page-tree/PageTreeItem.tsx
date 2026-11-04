"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { cx } from "@/lib/cx";
import type { PageNode } from "@/lib/pages/tree";
import { AddSubpageButton } from "./AddSubpageButton";

type Props = {
  node: PageNode;
  depth: number;
  slug: string;
  organizationId: string;
  currentId: string | null;
  expanded: Set<string>;
  setOpen: (ids: string[], open: boolean) => void;
  canCreate: boolean;
};

// Deeper levels stop indenting so titles keep some room in a 260px sidebar.
const INDENT_PX = 14;
const MAX_INDENT_DEPTH = 5;

export function PageTreeItem(props: Props) {
  const { node, depth, slug, organizationId, currentId, expanded, setOpen, canCreate } = props;
  const href = `/espacio/${slug}/p/${node.id}`;
  const current = node.id === currentId;
  const hasChildren = node.children.length > 0;
  const open = hasChildren && expanded.has(node.id);
  const title = node.title || "Sin título";

  return (
    <li>
      <div
        className={cx(
          "group relative flex min-h-11 items-center rounded-lg transition-colors duration-150",
          current ? "bg-accent-soft font-medium" : "hover:bg-surface/70",
        )}
        style={{ paddingLeft: Math.min(depth, MAX_INDENT_DEPTH) * INDENT_PX }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? "Plegar" : "Desplegar"} ${title}`}
            onClick={() => setOpen([node.id], !open)}
            className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:text-ink"
          >
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              aria-hidden
              className={cx("transition-transform duration-150 motion-reduce:transition-none", open && "rotate-90")}
            />
          </button>
        ) : (
          <span className="grid size-11 shrink-0 place-items-center text-ink-muted" aria-hidden>
            <FileText size={16} strokeWidth={1.5} />
          </span>
        )}
        <Link
          href={href}
          aria-current={current ? "page" : undefined}
          className={cx(
            "flex min-h-11 min-w-0 flex-1 items-center pr-2 text-[0.95rem]",
            canCreate && "pointer-coarse:pr-11 group-hover:pr-11 group-focus-within:pr-11",
          )}
        >
          <span className={cx("truncate", !node.title && "text-ink-muted italic")}>{title}</span>
        </Link>
        {canCreate ? (
          <AddSubpageButton
            organizationId={organizationId}
            parentId={node.id}
            parentTitle={title}
            onCreate={() => setOpen([node.id], true)}
          />
        ) : null}
      </div>
      {open ? (
        <ul className="flex flex-col gap-0.5 pt-0.5">
          {node.children.map((child) => (
            <PageTreeItem key={child.id} {...props} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
