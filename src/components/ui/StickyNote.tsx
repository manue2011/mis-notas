import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = {
  children: ReactNode;
  className?: string;
  /** Rotation in degrees. */
  rotate?: number;
};

export function StickyNote({ children, className, rotate = 1.5 }: Props) {
  return (
    <div
      className={cx(
        "relative bg-sticky px-5 pt-6 pb-5 font-hand text-xl leading-snug text-ink shadow-paper",
        className,
      )}
      style={{ rotate: `${rotate}deg` }}
    >
      <Pin />
      {children}
    </div>
  );
}

function Pin() {
  return (
    <span
      aria-hidden
      className="absolute top-2 left-1/2 block size-3.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_2px_2px_rgb(42_37_31/0.35)]"
    >
      <span className="absolute top-0.5 left-1 block size-1 rounded-full bg-white/60" />
    </span>
  );
}
