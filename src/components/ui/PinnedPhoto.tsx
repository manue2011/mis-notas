import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Tape } from "./Tape";

type Props = {
  children: ReactNode;
  caption?: string;
  className?: string;
};

/** A screenshot taped onto the page: white frame, slight tilt, two strips of tape. */
export function PinnedPhoto({ children, caption, className }: Props) {
  return (
    <figure
      className={cx("relative inline-block bg-white p-2 pb-3 shadow-paper", className)}
      style={{ rotate: "-0.8deg" }}
    >
      <Tape className="-top-1 -left-6 w-16" rotate={-32} />
      <Tape className="-top-1 -right-6 w-16" rotate={30} />
      <div className="overflow-hidden">{children}</div>
      {caption ? (
        <figcaption className="mt-2 font-hand text-lg leading-none text-ink-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
