import { Suspense } from "react";
import { Logo } from "@/components/ui/Logo";
import { SessionNav } from "./SessionNav";

/** Header for pages outside a workspace: logo home, session links on the right. */
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-12 lg:px-20">
      <Logo />
      <Suspense fallback={<div className="h-11" />}>
        <SessionNav />
      </Suspense>
    </header>
  );
}
