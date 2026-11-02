import { Fragment, type ReactNode } from "react";
import Link from "next/link";

type Crumb = { label: string; href?: string };

/** Breadcrumb ("Equipo Diseño / Exportar desde Figma") plus page actions on the right. */
export function TopBar({ crumbs, children }: { crumbs: Crumb[]; children?: ReactNode }) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-dashed border-border px-6 md:px-8">
      <nav aria-label="Ruta" className="flex min-w-0 items-center gap-2 text-sm text-ink-muted">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 ? <span aria-hidden>/</span> : null}
              {crumb.href && !last ? (
                <Link href={crumb.href} className="truncate hover:text-ink">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate text-ink" aria-current={last ? "page" : undefined}>
                  {crumb.label}
                </span>
              )}
            </Fragment>
          );
        })}
      </nav>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </header>
  );
}
