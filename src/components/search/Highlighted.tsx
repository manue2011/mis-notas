import { highlightParts } from "@/lib/pages/search-terms";

/** Text with the searched words marked in the workspace accent. */
export function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  return highlightParts(text, terms).map((part, i) =>
    part.match ? (
      <mark key={i} className="rounded-sm bg-accent-soft px-0.5 text-ink">
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}
