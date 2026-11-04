"use client";

import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { getPageTicketAction } from "@/lib/realtime/actions";

// One live connection per open page, shared by whoever renders it and kept
// outside React: components acquire it while mounted and release it after.
// A short grace period means React's mount → unmount → mount (Strict Mode,
// fast navigations) reuses the connection instead of opening two.

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type SessionState = {
  status: ConnectionStatus;
  /** Has received the page from the server at least once. */
  synced: boolean;
  /** Local changes the server hasn't confirmed yet. */
  unsynced: number;
  /** The server refused us (no access any more). */
  denied: boolean;
};

export type PageSession = {
  doc: Y.Doc;
  provider: HocuspocusProvider;
  /** Replaced (never mutated) on every change, for useSyncExternalStore. */
  state: SessionState;
};

type Entry = PageSession & { refs: number; closeTimer?: ReturnType<typeof setTimeout> };
type Options = { url: string; organizationId: string; pageId: string };

const RELEASE_GRACE_MS = 1500;
const sessions = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();

const notify = (pageId: string) => listeners.get(pageId)?.forEach((listener) => listener());

function open({ url, organizationId, pageId }: Options): Entry {
  const doc = new Y.Doc();
  const entry = { doc, refs: 0, state: { status: "connecting", synced: false, unsynced: 0, denied: false } } as Entry;
  const update = (patch: Partial<SessionState>) => {
    entry.state = { ...entry.state, ...patch };
    notify(pageId);
  };
  entry.provider = new HocuspocusProvider({
    url,
    name: pageId,
    document: doc,
    // Asked for on every (re)connection, so access is checked again each time.
    token: async () => {
      const ticket = await getPageTicketAction(organizationId, pageId).catch(() => null);
      return ticket?.ok ? ticket.token : "";
    },
    onStatus: ({ status }) => update({ status: status as ConnectionStatus }),
    onSynced: ({ state }) => {
      if (state) update({ synced: true });
    },
    onUnsyncedChanges: ({ number }) => update({ unsynced: number }),
    onAuthenticationFailed: () => update({ denied: true }),
  });
  return entry;
}

/** Starts using the page's session (opening it if needed). Returns the release. */
export function acquireSession(options: Options): () => void {
  let entry = sessions.get(options.pageId);
  if (!entry) {
    entry = open(options);
    sessions.set(options.pageId, entry);
    notify(options.pageId);
  }
  clearTimeout(entry.closeTimer);
  entry.refs += 1;

  const current = entry;
  return () => {
    current.refs -= 1;
    if (current.refs > 0) return;
    current.closeTimer = setTimeout(() => {
      if (current.refs > 0) return;
      current.provider.destroy();
      current.doc.destroy();
      sessions.delete(options.pageId);
      notify(options.pageId);
    }, RELEASE_GRACE_MS);
  };
}

export function getSession(pageId: string): PageSession | null {
  return sessions.get(pageId) ?? null;
}

/** For useSyncExternalStore: fires when the session opens, closes or changes state. */
export function subscribeSession(pageId: string, listener: () => void): () => void {
  let set = listeners.get(pageId);
  if (!set) listeners.set(pageId, (set = new Set()));
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(pageId);
  };
}
