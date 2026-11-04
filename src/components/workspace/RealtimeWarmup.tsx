"use client";

import { useEffect } from "react";

const DONE_KEY = "libreta-realtime-warm";

/**
 * Render's free plan sleeps after 15 idle minutes and takes a while to wake.
 * Pinging it as soon as a workspace opens gets that started while the person
 * is still finding their page. Once per tab.
 */
export function RealtimeWarmup({ healthUrl }: { healthUrl: string }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DONE_KEY)) return;
      sessionStorage.setItem(DONE_KEY, "1");
    } catch {
      // Storage blocked: ping anyway.
    }
    fetch(healthUrl, { mode: "no-cors", cache: "no-store" }).catch(() => undefined);
  }, [healthUrl]);
  return null;
}
