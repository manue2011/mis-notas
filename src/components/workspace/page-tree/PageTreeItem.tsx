"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { cx } from "@/lib/cx";
import type { PageNode } from "@/lib/pages/tree";
import { AddSubpageButton } from "./AddSubpageButton";
import { usePageTree } from "./tree-context";

// Deeper levels stop indenting so titles keep some room in a 260px sidebar.
const INDENT_PX = 14;
const MAX_INDENT_DEPTH = 5;

export function PageTreeItem({ node, depth }: { node: PageNode; depth: number }) {
  const tree = usePageTree();
  const href = `/espacio/${tree.slug}/p/${node.id}`;
  const current = node.id === tree.currentId;
  const hasChildren = node.children.length > 0;
  const open = hasChildren && tree.expanded.has(node.id);
  const title = node.title || "Sin título";
  const indent = Math.min(depth, MAX_INDENT_DEPTH) * INDENT_PX;
  const drop = tree.dropTarget?.id === node.id ? tree.dropTarget.zone : null;
  const dragging = tree.draggingId === node.id;

  return (
    <li>
      <div
        onDragOver={(e) => tree.onDragOver(e, node)}
        onDrop={tree.onDrop}
        className={cx(
          "group relative flex min-h-11 items-center rounded-lg transition-colors duration-150",
          current ? "bg-accent-soft font-medium" : "hover:bg-surface/70",
          drop === "inside" && "bg-accent-soft ring-2 ring-accent ring-inset",
          dragging && "opacity-50",
        )}
        style={{ paddingLeft: indent }}
      >
        {drop === "before" || drop === "after" ? (
          <span
            aria-hidden
            className={cx(
              "pointer-events-none absolute right-1 h-0.5 rounded-full bg-accent",
              drop === "before" ? "-top-px" : "-bottom-px",
            )}
            style={{ left: indent + 8 }}
          />
        ) : null}
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? "Plegar" : "Desplegar"} ${title}`}
            onClick={() => tree.setOpen([node.id], !open)}
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
          draggable={tree.canMove}
          onDragStart={tree.canMove ? (e) => tree.onDragStart(e, node) : undefined}
          onDragEnd={tree.onDragEnd}
          className={cx(
            "flex min-h-11 min-w-0 flex-1 items-center pr-2 text-[0.95rem]",
            tree.canCreate && "pointer-coarse:pr-11 group-hover:pr-11 group-focus-within:pr-11",
          )}
        >
          <span className={cx("truncate", !node.title && "text-ink-muted italic")}>{title}</span>
        </Link>
        {tree.canCreate && !tree.draggingId ? (
          <AddSubpageButton
            organizationId={tree.organizationId}
            parentId={node.id}
            parentTitle={title}
            onCreate={() => tree.setOpen([node.id], true)}
          />
        ) : null}
      </div>
      {open ? (
        <ul className="flex flex-col gap-0.5 pt-0.5">
          {node.children.map((child) => (
            <PageTreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
