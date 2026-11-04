"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { MAX_TITLE_LENGTH } from "@/lib/pages/content";

type Props = {
  initialTitle: string;
  /** Controlled value (real-time editing, where others change it too). */
  value?: string;
  editable: boolean;
  onChange: (title: string) => void;
  /** Moves focus into the body, e.g. after pressing Enter in the title. */
  onEnter: () => void;
};

export function PageTitle({ initialTitle, value, editable, onChange, onEnter }: Props) {
  const [local, setTitle] = useState(initialTitle);
  const title = value ?? local;
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the text instead of scrolling.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  if (!editable) {
    return (
      <h1 className="inline-block font-serif text-4xl leading-tight font-medium tracking-tight md:text-5xl">
        {title || "Sin título"}
        <HandUnderline className="mt-1" width="w-3/5" />
      </h1>
    );
  }

  return (
    <div className="inline-block w-full">
      <h1 className="sr-only">{title || "Sin título"}</h1>
      <textarea
        ref={ref}
        rows={1}
        value={title}
        maxLength={MAX_TITLE_LENGTH}
        placeholder="Sin título"
        aria-label="Título de la página"
        autoFocus={!initialTitle}
        onChange={(e) => {
          const next = e.currentTarget.value.replace(/\n/g, "");
          setTitle(next);
          onChange(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        // The hand-drawn underline marks the field; a focus box would fight it.
        className="block w-full resize-none overflow-hidden bg-transparent font-serif focus-visible:outline-none text-4xl leading-tight font-medium tracking-tight text-ink outline-none placeholder:text-ink-muted/50 md:text-5xl"
      />
      <HandUnderline className="mt-1" width="w-56" />
    </div>
  );
}
