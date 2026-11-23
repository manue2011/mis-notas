"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { WorkspaceMark } from "@/components/ui/WorkspaceMark";
import { cx } from "@/lib/cx";
import type { AccentKey } from "@/lib/accent";
import { useFoldedWorkspaces } from "./page-tree/expanded-store";

type Workspace = { id: string; slug: string; name: string; accent: AccentKey; icon: string | null };

type Props = {
  workspaces: Workspace[];
  currentSlug: string;
  /** What's inside the open workspace (its pages), shown unfolded below it. */
  children: ReactNode;
};

/** The workspaces, with the open one unfolded to show its pages. */
export function WorkspaceNav({ workspaces, currentSlug, children }: Props) {
  const { folded, setFolded } = useFoldedWorkspaces();

  return (
    <nav aria-label="Espacios de trabajo" className="flex flex-col gap-0.5">
      {workspaces.map((w) => {
        if (w.slug !== currentSlug) {
          return (
            <Link
              key={w.id}
              href={`/espacio/${w.slug}`}
              className="group flex min-h-11 items-center gap-3 rounded-lg px-2 text-[0.95rem] transition-colors duration-150 hover:bg-surface/70"
            >
              <WorkspaceMark name={w.name} accent={w.accent} icon={w.icon} />
              <span className="min-w-0 flex-1 truncate">{w.name}</span>
              <ChevronRight
                size={16}
                strokeWidth={1.5}
                aria-hidden
                className="mr-3.5 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100"
              />
            </Link>
          );
        }

        const open = !folded.has(w.id);
        const contentsId = `workspace-${w.id}-pages`;
        return (
          <div key={w.id} className="flex flex-col">
            <div className="flex min-h-11 items-center rounded-lg bg-accent-soft">
              <Link
                href={`/espacio/${w.slug}`}
                aria-current="true"
                className="flex min-h-11 min-w-0 flex-1 items-center gap-3 pl-2 text-[0.95rem] font-medium"
              >
                <WorkspaceMark name={w.name} accent={w.accent} icon={w.icon} />
                <span className="truncate">{w.name}</span>
              </Link>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={contentsId}
                aria-label={`${open ? "Plegar" : "Desplegar"} las páginas de ${w.name}`}
                onClick={() => setFolded([w.id], open)}
                className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:text-ink"
              >
                <ChevronRight
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden
                  className={cx("transition-transform duration-150 motion-reduce:transition-none", open && "rotate-90")}
                />
              </button>
            </div>
            <div
              id={contentsId}
              hidden={!open}
              className="mt-1 mb-2 ml-[1.375rem] flex flex-col gap-0.5 border-l border-border pl-1.5"
            >
              {children}
            </div>
          </div>
        );
      })}
      <Link
        href="/nuevo-espacio"
        className="mt-1.5 flex min-h-11 items-center gap-2.5 rounded-lg border border-dashed border-field-line px-3 text-sm text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
      >
        <Plus size={16} strokeWidth={1.5} aria-hidden />
        Crear espacio nuevo
      </Link>
    </nav>
  );
}
