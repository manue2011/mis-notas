import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function SidebarSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("flex flex-col gap-2", className)}>
      <h2 className="px-2 text-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
