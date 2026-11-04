"use client";

import { useEffect, useState } from "react";
import { searchPagesAction } from "@/lib/pages/search-actions";
import type { SearchHit } from "@/lib/pages/search";

const DEBOUNCE_MS = 200;

/** Full-text hits for `query`, fetched after a short pause in typing. */
export function useRemoteSearch(organizationId: string, query: string) {
  const [result, setResult] = useState<{ query: string; hits: SearchHit[] }>({ query: "", hits: [] });
  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;
    let stale = false;
    const timer = setTimeout(() => {
      searchPagesAction(organizationId, trimmed)
        .then((hits) => !stale && setResult({ query: trimmed, hits }))
        // Title matches still work locally; text matches just don't show up.
        .catch(() => !stale && setResult({ query: trimmed, hits: [] }));
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [organizationId, trimmed]);

  return {
    // Hits for an older query are dropped rather than shown against the new one.
    hits: trimmed && result.query === trimmed ? result.hits : [],
    loading: trimmed !== "" && result.query !== trimmed,
  };
}
