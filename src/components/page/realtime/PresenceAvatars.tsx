"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getSession, subscribeSession } from "./session-store";

type Person = { id: string; name: string; color: string };

const MAX_SHOWN = 4;
const noop = () => () => {};

/**
 * Who else has this page open, as initials in their cursor colour. Reads the
 * page's live session (opened by the page itself); one avatar per person even
 * with several tabs open.
 */
export function PresenceAvatars({ pageId, selfId }: { pageId: string; selfId: string }) {
  const subscribeToSession = useCallback((listener: () => void) => subscribeSession(pageId, listener), [pageId]);
  const session = useSyncExternalStore(subscribeToSession, () => getSession(pageId), () => null);
  const awareness = session?.provider.awareness ?? null;

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!awareness) return noop();
      awareness.on("change", listener);
      return () => awareness.off("change", listener);
    },
    [awareness],
  );
  // A string, so an unchanged list doesn't re-render.
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (awareness ? othersKey(awareness.getStates(), awareness.clientID, selfId) : "[]"),
    () => "[]",
  );
  const people = useMemo(() => JSON.parse(snapshot) as Person[], [snapshot]);
  if (people.length === 0) return null;

  const shown = people.slice(0, MAX_SHOWN);
  const names = people.map((p) => p.name).join(", ");
  return (
    <div className="flex items-center" role="group" aria-label={`También en esta página: ${names}`} title={names}>
      {shown.map((person) => (
        <span
          key={person.id}
          aria-hidden
          className="-ml-1.5 grid size-8 place-items-center rounded-full border-2 border-paper text-xs font-semibold text-white first:ml-0"
          style={{ backgroundColor: person.color }}
        >
          {initials(person.name)}
        </span>
      ))}
      {people.length > MAX_SHOWN ? (
        <span aria-hidden className="-ml-1.5 grid size-8 place-items-center rounded-full border-2 border-paper bg-panel text-xs text-ink-muted">
          +{people.length - MAX_SHOWN}
        </span>
      ) : null}
    </div>
  );
}

function othersKey(states: Map<number, Record<string, unknown>>, ownClient: number, selfId: string): string {
  const byId = new Map<string, Person>();
  for (const [client, state] of states) {
    const user = state.user as Partial<Person> | undefined;
    if (client === ownClient || !user?.id || !user.name || user.id === selfId) continue;
    byId.set(user.id, { id: user.id, name: user.name, color: user.color ?? "#6b6156" });
  }
  return JSON.stringify([...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "es")));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "·") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
