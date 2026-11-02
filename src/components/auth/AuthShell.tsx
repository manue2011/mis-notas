import type { ReactNode } from "react";
import { AccentScope } from "@/components/ui/AccentScope";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { AuthDecor } from "./AuthDecor";

type Props = {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
};

/** Form on the left, decorative desk on the right (hidden on small screens). */
export function AuthShell({ title, intro, children }: Props) {
  return (
    <AccentScope accent={DEFAULT_ACCENT} className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="flex flex-col px-6 py-10 sm:px-12 lg:px-20">
        <p className="font-serif text-xl font-medium">Libreta</p>
        <div className="my-auto w-full max-w-sm pt-12 pb-8">
          <h1 className="inline-block font-serif text-4xl font-medium tracking-tight">
            {title}
            <HandUnderline className="mt-1" />
          </h1>
          {intro ? <div className="mt-4 text-ink-muted">{intro}</div> : null}
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <AuthDecor />
    </AccentScope>
  );
}
