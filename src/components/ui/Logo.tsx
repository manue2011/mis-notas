import Link from "next/link";
import { PencilLine } from "lucide-react";
import { cx } from "@/lib/cx";

/** The Libreta mark. Links to the home page unless `href` is null. */
export function Logo({ className, href = "/" }: { className?: string; href?: string | null }) {
  const mark = (
    <>
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-on-accent shadow-[0_1px_2px_rgb(42_37_31/0.25)]">
        <PencilLine size={15} strokeWidth={2} aria-hidden />
      </span>
      <span className="font-hand text-3xl leading-none text-ink">Libreta</span>
    </>
  );

  if (href === null) {
    return <span className={cx("inline-flex items-center gap-2.5", className)}>{mark}</span>;
  }
  return (
    <Link
      href={href}
      aria-label="Libreta, página principal"
      className={cx("inline-flex min-h-11 w-fit items-center gap-2.5 rounded-md", className)}
    >
      {mark}
    </Link>
  );
}
