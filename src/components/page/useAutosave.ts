"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PageActionResult } from "@/lib/pages/actions";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Saves the latest value a moment after the last change. Only one save runs
 * at a time; changes made meanwhile are saved right after. Pending changes
 * are flushed when the component unmounts (e.g. navigating to another page).
 */
export function useAutosave<T>(save: (value: T) => Promise<PageActionResult>, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const saveRef = useRef(save);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queued = useRef<{ value: T } | null>(null);
  const running = useRef(false);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    // Keep going while changes arrive during a save.
    while (queued.current) {
      const { value } = queued.current;
      queued.current = null;
      setStatus("saving");
      try {
        const result = await saveRef.current(value);
        if (result.ok) {
          setSavedAt(result.savedAt);
          setError(null);
          setStatus(queued.current ? "pending" : "saved");
        } else {
          setError(result.error);
          setStatus("error");
        }
      } catch {
        setError("No se ha podido guardar. Revisa tu conexión.");
        setStatus("error");
      }
    }
    running.current = false;
  }, []);

  const schedule = useCallback(
    (value: T) => {
      queued.current = { value };
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void run(), delay);
    },
    [delay, run],
  );

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (queued.current || running.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
      void run();
    };
  }, [run]);

  return { schedule, status, error, savedAt };
}
