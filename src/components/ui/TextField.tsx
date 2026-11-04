import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Rendered inside the field, after the input (e.g. a show-password toggle). */
  trailing?: ReactNode;
  /** Rendered at the end of the label row (e.g. a "forgot password?" link). */
  labelAside?: ReactNode;
};

export function TextField({ label, hint, error, trailing, labelAside, className, ...rest }: Props) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <div
        className={cx(
          "flex items-center border-b-[1.5px] transition-colors duration-150",
          "focus-within:border-accent-ink",
          error ? "border-error" : "border-field-line",
        )}
      >
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-11 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted/70"
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
