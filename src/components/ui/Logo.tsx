import { PencilLine } from "lucide-react";
import { cx } from "@/lib/cx";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-on-accent shadow-[0_1px_2px_rgb(42_37_31/0.25)]">
        <PencilLine size={15} strokeWidth={2} aria-hidden />
      </span>
      <span className="font-hand text-3xl leading-none text-ink">Libreta</span>
    </span>
  );
}
