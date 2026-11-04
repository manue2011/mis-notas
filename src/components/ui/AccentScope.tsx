import type { CSSProperties, ReactNode } from "react";
import { accentHex, type AccentKey } from "@/lib/accent";
import { cx } from "@/lib/cx";

type Props = {
  accent: AccentKey;
  /** The workspace's typeface for note text (see --font-notes). */
  font?: "serif" | "sans" | "mono";
  className?: string;
  children: ReactNode;
};

export function AccentScope({ accent, font = "serif", className, children }: Props) {
  return (
    <div
      className={cx("accent-scope", className)}
      style={{ "--accent": accentHex(accent), "--font-notes": `var(--font-${font})` } as CSSProperties}
    >
      {children}
    </div>
  );
}
