import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Short handwritten annotation. Never use for long text. */
export function MarginNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("font-hand text-xl leading-tight text-ink-muted", className)}>
      {children}
    </span>
  );
}
