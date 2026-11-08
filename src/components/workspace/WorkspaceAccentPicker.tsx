"use client";

import { useRef, useState, useTransition } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { AccentSelect } from "@/components/ui/AccentSelect";
import { accentHex, type AccentKey } from "@/lib/accent";
import { setAccentAction } from "@/lib/workspace/actions";

export function WorkspaceAccentPicker({
  organizationId,
  accent,
}: {
  organizationId: string;
  accent: AccentKey;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(accent);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Repaints the workspace right away; the server render catches up after.
  function paint(next: AccentKey) {
    ref.current?.closest<HTMLElement>(".accent-scope")?.style.setProperty("--accent", accentHex(next));
  }

  function change(next: AccentKey) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    paint(next);
    setError(null);
    startTransition(async () => {
      const result = await setAccentAction(organizationId, next);
      if (!result.ok) {
        setValue(previous);
        paint(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div ref={ref} className="flex flex-col gap-1">
      <AccentSelect value={value} onChange={change} onPreview={paint} label="Color del espacio" />
      <FormAlert message={error} />
    </div>
  );
}
