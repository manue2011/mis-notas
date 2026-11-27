"use client";

import { useId } from "react";
import { cx } from "@/lib/cx";
import { buildTree, type FlatPage, type PageNode } from "@/lib/pages/tree";

type Props = {
  pages: FlatPage[];
  /** null: the whole workspace. */
  value: string[] | null;
  onChange: (next: string[] | null) => void;
  disabled?: boolean;
};

const INDENT_PX = 18;

/**
 * "Todo el cuaderno" or a pick of pages. A ticked page brings everything
 * inside it, so its sub-pages show as included rather than as choices.
 */
export function PageScopePicker({ pages, value, onChange, disabled }: Props) {
  const name = useId();
  const chosen = new Set(value ?? []);

  function toggle(id: string, on: boolean) {
    const next = new Set(chosen);
    if (on) next.add(id);
    else next.delete(id);
    onChange([...next]);
  }

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-1">
      <legend className="sr-only">Qué páginas puede ver</legend>
      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <input
          type="radio"
          name={name}
          checked={value === null}
          onChange={() => onChange(null)}
          className="size-4 accent-accent"
        />
        Todo el cuaderno
      </label>
      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <input
          type="radio"
          name={name}
          checked={value !== null}
          onChange={() => onChange(value ?? [])}
          className="size-4 accent-accent"
        />
        Solo algunas páginas
      </label>
      {value !== null ? (
        pages.length === 0 ? (
          <p className="pl-6 text-sm text-ink-muted">Este cuaderno aún no tiene páginas.</p>
        ) : (
          <ul className="ml-6 max-h-72 overflow-y-auto rounded-md border border-border bg-surface/60 p-1.5">
            {buildTree(pages).map((node) => (
              <PageOption key={node.id} node={node} depth={0} chosen={chosen} included={false} onToggle={toggle} />
            ))}
          </ul>
        )
      ) : null}
    </fieldset>
  );
}

type OptionProps = {
  node: PageNode;
  depth: number;
  chosen: Set<string>;
  /** A page above it is ticked. */
  included: boolean;
  onToggle: (id: string, on: boolean) => void;
};

function PageOption({ node, depth, chosen, included, onToggle }: OptionProps) {
  const ticked = chosen.has(node.id);
  return (
    <li>
      <label
        className={cx("flex min-h-11 items-center gap-2.5 rounded px-2 text-sm hover:bg-panel", included && "text-ink-muted")}
        style={{ paddingLeft: 8 + depth * INDENT_PX }}
      >
        <input
          type="checkbox"
          checked={ticked || included}
          disabled={included}
          onChange={(e) => onToggle(node.id, e.currentTarget.checked)}
          className="size-4 shrink-0 accent-accent"
        />
        <span className={cx("truncate font-serif text-base", !node.title && "italic")}>
          {node.title || "Sin título"}
        </span>
        {included ? <span className="shrink-0 font-hand text-base">incluida</span> : null}
      </label>
      {node.children.length ? (
        <ul>
          {node.children.map((child) => (
            <PageOption
              key={child.id}
              node={child}
              depth={depth + 1}
              chosen={chosen}
              included={included || ticked}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
