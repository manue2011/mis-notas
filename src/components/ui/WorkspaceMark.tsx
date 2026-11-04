import { accentHex, type AccentKey } from "@/lib/accent";
import { cx } from "@/lib/cx";
import { isWorkspaceIcon, WORKSPACE_ICONS } from "@/lib/workspace/icons";
import { Monogram } from "./Monogram";

type Props = {
  name: string;
  accent: AccentKey;
  icon?: string | null;
  className?: string;
};

/** A workspace's chosen icon on its accent, or its initial if it has none. */
export function WorkspaceMark({ name, accent, icon, className }: Props) {
  if (!isWorkspaceIcon(icon)) return <Monogram name={name} accent={accent} className={className} />;
  const { Icon } = WORKSPACE_ICONS[icon];
  return (
    <span
      aria-hidden
      className={cx(
        "grid size-7 shrink-0 place-items-center rounded-md text-on-accent transition-colors duration-[450ms]",
        className,
      )}
      style={{ backgroundColor: accentHex(accent) }}
    >
      <Icon className="size-[60%]" strokeWidth={1.75} />
    </span>
  );
}
