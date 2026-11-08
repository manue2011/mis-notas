"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { ACCENTS, ACCENT_KEYS, type AccentKey } from "@/lib/accent";
import { cx } from "@/lib/cx";

type Props = {
  value: AccentKey;
  onChange: (accent: AccentKey) => void;
  /** Called while moving through the list (and with `value` again on cancel). */
  onPreview?: (accent: AccentKey) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

function Swatch({ accent, className }: { accent: AccentKey; className?: string }) {
  return (
    <span
      aria-hidden
      // The thin ring keeps dark accents (grafito) visible on the dark panels.
      className={cx("block size-4 shrink-0 rounded-full ring-1 ring-ink/20 ring-inset", className)}
      style={{ backgroundColor: ACCENTS[accent].hex }}
    />
  );
}

/** The workspace accents as a dropdown: the current one shows, the rest on demand. */
export function AccentSelect({ value, onChange, onPreview, label, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const optionId = (key: AccentKey) => `${id}-${key}`;

  function show() {
    setActive(value);
    setOpen(true);
  }

  function close({ restore = true, focus = true } = {}) {
    setOpen(false);
    if (restore) onPreview?.(value);
    if (focus) buttonRef.current?.focus();
  }

  function choose(key: AccentKey) {
    close({ restore: key === value });
    if (key !== value) onChange(key);
  }

  function move(key: AccentKey) {
    setActive(key);
    onPreview?.(key);
    document.getElementById(optionId(key))?.scrollIntoView({ block: "nearest" });
  }

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close({ focus: false });
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
    // close() only reads the latest value; re-subscribing on each render isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleListKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = ACCENT_KEYS.indexOf(active);
    const last = ACCENT_KEYS.length - 1;
    const target = {
      ArrowDown: Math.min(index + 1, last),
      ArrowUp: Math.max(index - 1, 0),
      Home: 0,
      End: last,
    }[event.key];
    if (target !== undefined) {
      event.preventDefault();
      move(ACCENT_KEYS[target]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close({ focus: false });
    }
  }

  function handleButtonKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      show();
    }
  }

  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${ACCENTS[value].label}`}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={handleButtonKey}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-md border border-border bg-surface/60 px-3 text-left text-sm transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Swatch accent={value} />
        <span className="flex-1 truncate">{ACCENTS[value].label}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className={cx("text-ink-muted transition-transform duration-150", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={optionId(active)}
          onKeyDown={handleListKey}
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-80 min-w-52 overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-paper outline-none"
        >
          {ACCENT_KEYS.map((key) => (
            <div
              key={key}
              id={optionId(key)}
              role="option"
              aria-selected={key === value}
              onPointerEnter={() => move(key)}
              onClick={() => choose(key)}
              className={cx(
                "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm",
                key === active && "bg-accent-soft",
              )}
            >
              <Swatch accent={key} className="size-5" />
              <span className="flex-1">{ACCENTS[key].label}</span>
              {key === value ? <Check size={16} strokeWidth={1.75} aria-hidden className="text-ink" /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
