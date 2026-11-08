import type { ReactNode } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AccentScope } from "@/components/ui/AccentScope";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { MarginNote } from "@/components/ui/MarginNote";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { LEGAL_UPDATED } from "@/lib/legal";

/** A legal text set like a page of the notebook: serif body, ruled width. */
export function LegalPage({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <AccentScope accent={DEFAULT_ACCENT} className="min-h-screen">
      <SiteHeader />
      <main className="px-6 pt-4 pb-20 sm:px-12 lg:px-20">
        <article className="max-w-2xl">
          <h1 className="inline-block font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            {title}
            <HandUnderline className="mt-1" />
          </h1>
          <p className="mt-3 text-sm text-ink-muted">Última actualización: {LEGAL_UPDATED}</p>
          <p className="mt-6 font-serif text-lg leading-relaxed">{summary}</p>
          <MarginNote className="mt-2 block -rotate-1">lo importante, en corto</MarginNote>
          <div className="mt-10 flex flex-col gap-10 font-serif text-[1.05rem] leading-relaxed [&_a]:underline [&_a]:decoration-accent [&_a]:underline-offset-4 [&_a:hover]:text-accent">
            {children}
          </div>
        </article>
      </main>
      <LandingFooter />
    </AccentScope>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-sans text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-accent">{children}</ul>;
}
