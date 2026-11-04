import Link from "next/link";
import { Plus } from "lucide-react";
import { WorkspaceMark } from "@/components/ui/WorkspaceMark";
import { cx } from "@/lib/cx";
import type { WorkspaceSummary } from "@/lib/workspace/queries";

export function WorkspaceNav({
  workspaces,
  currentSlug,
}: {
  workspaces: WorkspaceSummary[];
  currentSlug: string;
}) {
  return (
    <nav aria-label="Espacios de trabajo" className="flex flex-col gap-0.5">
      {workspaces.map((w) => {
        const current = w.slug === currentSlug;
        return (
          <Link
            key={w.id}
            href={`/espacio/${w.slug}`}
            aria-current={current ? "page" : undefined}
            className={cx(
              "flex min-h-11 items-center gap-3 rounded-lg px-2 text-[0.95rem] transition-colors duration-150",
              current ? "bg-accent-soft font-medium" : "hover:bg-surface/70",
            )}
          >
            <WorkspaceMark name={w.name} accent={w.accent} icon={w.icon} />
            <span className="truncate">{w.name}</span>
          </Link>
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
