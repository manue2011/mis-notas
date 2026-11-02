import { accentHex, type AccentKey } from "@/lib/accent";
import { cx } from "@/lib/cx";

/** First letter of a workspace on its own accent color. Stands in for an icon. */
export function Monogram({
  name,
  accent,
  className,
}: {
  name: string;
  accent: AccentKey;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "grid size-7 shrink-0 place-items-center rounded-md text-sm font-semibold text-on-accent transition-colors duration-[450ms]",
        className,
      )}
      style={{ backgroundColor: accentHex(accent) }}
    >
      {name.trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
}
