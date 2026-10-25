import type { CSSProperties, ReactNode } from "react";
import { accentHex, type AccentKey } from "@/lib/accent";
import { cx } from "@/lib/cx";

type Props = {
  accent: AccentKey;
  className?: string;
  children: ReactNode;
};

export function AccentScope({ accent, className, children }: Props) {
  return (
    <div
      className={cx("accent-scope", className)}
      style={{ "--accent": accentHex(accent) } as CSSProperties}
    >
      {children}
    </div>
  );
}
