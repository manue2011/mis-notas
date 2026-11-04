import Form from "next/form";
import { Search } from "lucide-react";

type Props = {
  slug: string;
  defaultValue?: string;
  autoFocus?: boolean;
};

/** The notebook-line field on the results screen. */
export function SearchField({ slug, defaultValue, autoFocus }: Props) {
  return (
    <Form action={`/espacio/${slug}/buscar`} role="search">
      <label className="flex items-center gap-2 border-b-[1.5px] border-field-line transition-colors duration-150 focus-within:border-accent-ink">
        <Search size={20} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
        <span className="sr-only">Buscar en este espacio</span>
        <input
          // Remount with the new query when navigating between searches.
          key={defaultValue}
          type="search"
          name="q"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          maxLength={200}
          placeholder="Un título, una palabra, un trozo de frase…"
          className="min-h-11 w-full bg-transparent font-serif text-xl text-ink outline-none placeholder:text-ink-muted/70"
        />
      </label>
    </Form>
  );
}
