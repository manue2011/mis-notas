"use client";

import { createContext, use, type ReactNode } from "react";

// Whether the person sees only some pages of the workspace (see
// src/lib/pages/scope.ts). The server already leaves the other pages out;
// this only changes wording that could hint at them.
const LimitedContext = createContext(false);

export function LimitedScope({ limited, children }: { limited: boolean; children: ReactNode }) {
  return <LimitedContext value={limited}>{children}</LimitedContext>;
}

export function useLimitedScope(): boolean {
  return use(LimitedContext);
}
