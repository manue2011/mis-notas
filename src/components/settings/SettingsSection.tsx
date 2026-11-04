import type { ReactNode } from "react";

type Props = { id: string; title: string; description?: ReactNode; children: ReactNode };

/** One block of the settings screen: heading and blurb on the left, controls on the right. */
export function SettingsSection({ id, title, description, children }: Props) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      id={id}
      className="grid scroll-mt-6 gap-6 border-t border-dashed border-border py-10 md:grid-cols-[13rem_1fr] md:gap-10"
    >
      <div className="flex flex-col gap-2">
        <h2 id={`${id}-title`} className="font-serif text-2xl font-medium">
          {title}
        </h2>
        {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
