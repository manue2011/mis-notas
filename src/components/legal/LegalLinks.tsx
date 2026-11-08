import Link from "next/link";
import { cx } from "@/lib/cx";

/** "Privacidad · Condiciones", for footers and the sign-in screens. */
export function LegalLinks({ className }: { className?: string }) {
  const link = "inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline";
  return (
    <nav aria-label="Información legal" className={cx("flex items-center gap-3 text-sm text-ink-muted", className)}>
      <Link href="/privacidad" className={link}>
        Privacidad
      </Link>
      <span aria-hidden>·</span>
      <Link href="/terminos" className={link}>
        Condiciones de uso
      </Link>
    </nav>
  );
}
