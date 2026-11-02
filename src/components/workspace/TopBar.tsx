import Link from "next/link";

/** Breadcrumb bar. Pages (step 7) add themselves after the workspace name. */
export function TopBar({ workspaceName, slug }: { workspaceName: string; slug: string }) {
  return (
    <header className="flex min-h-16 items-center border-b border-dashed border-border px-6 md:px-8">
      <nav aria-label="Ruta" className="text-sm text-ink-muted">
        <Link href={`/espacio/${slug}`} className="hover:text-ink">
          {workspaceName}
        </Link>
      </nav>
    </header>
  );
}
