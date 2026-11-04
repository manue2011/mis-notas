import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  danger?: boolean;
};

export function PageMenuItem({ icon: Icon, danger, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cx(
        "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-sm hover:bg-panel",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
        danger && "text-error",
        className,
      )}
      {...rest}
    >
      <Icon size={16} strokeWidth={1.5} aria-hidden />
      {children}
    </button>
  );
}
