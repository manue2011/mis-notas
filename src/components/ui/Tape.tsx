import { cx } from "@/lib/cx";

type Props = {
  className?: string;
  /** Rotation in degrees. */
  rotate?: number;
};

/** A strip of translucent tape in the workspace accent. Purely decorative. */
export function Tape({ className, rotate = -4 }: Props) {
  return (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute block h-5 w-20 bg-accent-tape",
        "[clip-path:polygon(2%_0,98%_6%,100%_94%,0_100%)]",
        className,
      )}
      style={{ rotate: `${rotate}deg` }}
    />
  );
}
