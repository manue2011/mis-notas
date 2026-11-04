"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Which sidebar branches are open, per workspace. Kept in localStorage: it's a
// per-person convenience, so losing it (private window, cleared data) is fine.

const listeners = new Set<() => void>();
const memory = new Map<string, string>();

const storageKey = (organizationId: string) => `libreta:expanded:${organizationId}`;

function read(key: string): string {
  if (!memory.has(key)) {
    let value = "[]";
    try {
      value = localStorage.getItem(key) ?? "[]";
    } catch {}
    memory.set(key, value);
  }
  return memory.get(key)!;
}

function write(key: string, ids: Set<string>) {
  const value = JSON.stringify([...ids]);
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {}
  listeners.forEach((listener) => listener());
}

function parse(value: string): Set<string> {
  try {
    const ids: unknown = JSON.parse(value);
    return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useExpandedPages(organizationId: string) {
  const key = storageKey(organizationId);
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => "[]",
  );
  const expanded = useMemo(() => parse(raw), [raw]);

  const setOpen = useCallback(
    (ids: string[], open: boolean) => {
      const next = parse(read(key));
      ids.forEach((id) => (open ? next.add(id) : next.delete(id)));
      write(key, next);
    },
    [key],
  );

  return { expanded, setOpen };
}
