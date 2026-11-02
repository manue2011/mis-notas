import type { ReactNode } from "react";
import { AccentScope } from "@/components/ui/AccentScope";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { Logo } from "@/components/ui/Logo";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { AuthDecor } from "./AuthDecor";

/** Form on the left, decorative desk on the right (hidden on small screens). */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <AccentScope
      accent={DEFAULT_ACCENT}
      className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-[10%]">
        <div className="w-full max-w-[25rem]">
          <Logo />
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <AuthDecor />
    </AccentScope>
  );
}

export function AuthTitle({ children, intro }: { children: ReactNode; intro?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="inline-block font-serif text-[2.75rem] leading-tight font-medium tracking-tight">
        {children}
        <HandUnderline className="mt-1" width="w-2/5" />
      </h1>
      {intro ? <p className="mt-3 text-ink-muted">{intro}</p> : null}
    </div>
  );
}

export function AuthFootnote({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-center text-sm text-ink-muted">{children}</p>;
}
