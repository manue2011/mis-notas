"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { acquireSession, getSession, subscribeSession, type SessionState } from "./session-store";

type Options = { url: string; organizationId: string; pageId: string };

/** The page's live session while this component is mounted, plus its state. */
export function usePageSession({ url, organizationId, pageId }: Options) {
  useEffect(() => acquireSession({ url, organizationId, pageId }), [url, organizationId, pageId]);

  const subscribe = useCallback((listener: () => void) => subscribeSession(pageId, listener), [pageId]);
  const session = useSyncExternalStore(subscribe, () => getSession(pageId), () => null);
  // Read separately: `state` is replaced on every change, the session isn't.
  const state = useSyncExternalStore(
    subscribe,
    () => getSession(pageId)?.state ?? null,
    () => null,
  ) as SessionState | null;

  return { session, state };
}
