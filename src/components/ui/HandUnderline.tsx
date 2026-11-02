import { cx } from "@/lib/cx";

/** A pen stroke drawn under a title, in the workspace accent. */
export function HandUnderline({
  className,
  width = "w-full",
}: {
  className?: string;
  /** Tailwind width class; separate so it doesn't fight the default. */
  width?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 12"
      preserveAspectRatio="none"
      className={cx("block h-2.5 text-accent", width, className)}
    >
      <path
        d="M2 8.5c38-3.2 81-5.4 126-5.1 52 .3 92 2.6 132 2.2 14-.1 27-.8 38-1.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M40 10.2c46-2 98-2.6 152-1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
