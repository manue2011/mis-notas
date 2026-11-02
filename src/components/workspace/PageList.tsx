"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { MarginNote } from "@/components/ui/MarginNote";
import { cx } from "@/lib/cx";

type Props = {
  slug: string;
  pages: { id: string; title: string }[];
};

export function PageList({ slug, pages }: Props) {
  const pathname = usePathname();

  if (pages.length === 0) {
    return <MarginNote className="px-2 text-lg">aún no hay ninguna página</MarginNote>;
  }

  return (
    <nav aria-label="Páginas" className="flex flex-col gap-0.5">
      {pages.map((p) => {
        const href = `/espacio/${slug}/p/${p.id}`;
        const current = pathname === href;
        return (
          <Link
            key={p.id}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cx(
              "flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-[0.95rem] transition-colors duration-150",
              current ? "bg-accent-soft font-medium" : "hover:bg-surface/70",
            )}
          >
            <FileText size={16} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
            <span className={cx("truncate", !p.title && "text-ink-muted italic")}>
              {p.title || "Sin título"}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
