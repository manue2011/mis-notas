import { Check } from "lucide-react";

type Props = {
  /** What the AI says it changed. */
  changes: string[];
  /** Words of the page it may have left out. */
  missing: string[];
};

/** What the AI changed, as notes in the margin, and what it may have left out. */
export function TidyChanges({ changes, missing }: Props) {
  if (!changes.length && !missing.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {changes.length ? (
        <ul aria-label="Lo que ha cambiado la IA" className="space-y-0.5">
          {changes.map((change) => (
            <li key={change} className="flex items-start gap-2 font-hand text-xl leading-snug text-ink">
              <Check size={16} strokeWidth={2} aria-hidden className="mt-1 shrink-0 text-accent" />
              {change}
            </li>
          ))}
        </ul>
      ) : null}
      {missing.length ? (
        <p role="alert" className="text-sm text-error">
          Ojo: puede que se haya dejado algo. No encuentro estas palabras: {missing.join(", ")}. Compáralo con «Antes»
          antes de aplicarlo.
        </p>
      ) : null}
    </div>
  );
}
