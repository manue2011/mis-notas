import { WorkspaceMark } from "@/components/ui/WorkspaceMark";
import { cx } from "@/lib/cx";
import type { PaletteItem } from "./palette-items";

type Props = {
  id: string;
  items: PaletteItem[];
  activeIndex: number;
  onHover: (index: number) => void;
  onPick: (item: PaletteItem) => void;
};

export const optionId = (listId: string, index: number) => `${listId}-${index}`;

/** The palette's results, grouped under small headings. */
export function PaletteList({ id, items, activeIndex, onHover, onPick }: Props) {
  return (
    <ul id={id} role="listbox" aria-label="Resultados" className="flex flex-col">
      {items.map((item, i) => {
        const Icon = item.icon;
        const active = i === activeIndex;
        return (
          <li key={item.id} role="presentation">
            {i === 0 || items[i - 1].group !== item.group ? (
              <div
                role="presentation"
                className="px-3 pt-3 pb-1 text-xs font-semibold tracking-[0.08em] text-ink-muted uppercase"
              >
                {item.group}
              </div>
            ) : null}
            <div
              id={optionId(id, i)}
              role="option"
              aria-selected={active}
              onPointerMove={() => !active && onHover(i)}
              // Keep focus in the input.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => onPick(item)}
              className={cx(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5",
                active && "bg-accent-soft",
              )}
            >
              {item.workspace ? (
                <WorkspaceMark {...item.workspace} className="size-6 text-xs" />
              ) : Icon ? (
                <Icon size={18} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
              ) : null}
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{item.label}</span>
                {item.detail ? <span className="truncate text-xs text-ink-muted">{item.detail}</span> : null}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
