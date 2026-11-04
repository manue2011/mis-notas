import Form from "next/form";
import { Search } from "lucide-react";
import { cx } from "@/lib/cx";

type Props = {
  slug: string;
  defaultValue?: string;
  /** "sidebar": compact; "page": the big field on the results screen. */
  variant?: "sidebar" | "page";
  autoFocus?: boolean;
};

/** A notebook-line search field; submitting opens the results screen. */
export function SearchField({ slug, defaultValue, variant = "sidebar", autoFocus }: Props) {
  const big = variant === "page";
  return (
    <Form action={`/espacio/${slug}/buscar`} role="search" className={cx(!big && "px-2")}>
      <label className="flex items-center gap-2 border-b-[1.5px] border-field-line transition-colors duration-150 focus-within:border-accent">
        <Search size={big ? 20 : 16} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
        <span className="sr-only">Buscar en este espacio</span>
        <input
          // Remount with the new query when navigating between searches.
          key={defaultValue}
          type="search"
          name="q"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          maxLength={200}
          placeholder={big ? "Un título, una palabra, un trozo de frase…" : "Buscar…"}
          className={cx(
            "min-h-11 w-full bg-transparent text-ink outline-none placeholder:text-ink-muted/70",
            big ? "font-serif text-xl" : "text-sm",
          )}
        />
      </label>
    </Form>
  );
}
