import { PersonRow, SearchableList } from "@/components/ui/SearchableList";
import { formatDate } from "@/lib/format";
import type { MemberRow } from "@/lib/members/queries";
import { roleLabel } from "@/lib/members/roles";
import { scopeSummary } from "@/lib/pages/scope-summary";
import type { FlatPage } from "@/lib/pages/tree";
import { MemberControls } from "./MemberControls";
import { MemberPages } from "./MemberPages";

type Props = { organizationId: string; members: MemberRow[]; currentUserId: string; pages: FlatPage[] };

/** One line per member; the role, pages and "Quitar" unfold under it. */
export function MembersList({ organizationId, members, currentUserId, pages }: Props) {
  return (
    <SearchableList
      noun={{ one: "persona", many: "personas" }}
      rows={members.map((m) => {
        const isSelf = m.userId === currentUserId;
        return {
          key: m.id,
          search: `${m.name} ${m.email}`,
          node: (
            <PersonRow
              summary={
                <>
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-panel text-sm font-semibold text-ink-muted"
                  >
                    {m.name.trim().charAt(0).toUpperCase() || "·"}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {m.name}
                      {isSelf ? <span className="ml-2 font-hand text-lg font-normal text-ink-muted">(tú)</span> : null}
                    </span>
                    <span className="truncate text-sm text-ink-muted">{m.email}</span>
                  </span>
                  <span className="hidden shrink-0 flex-col items-end text-sm sm:flex">
                    <span>{roleLabel(m.role)}</span>
                    {m.role !== "admin" && m.pageIds ? (
                      <span className="text-ink-muted">Ve: {scopeSummary(pages, m.pageIds)}</span>
                    ) : null}
                  </span>
                </>
              }
            >
              <MemberControls
                organizationId={organizationId}
                memberId={m.id}
                name={m.name}
                role={m.role}
                isSelf={isSelf}
              />
              <MemberPages
                // Reset the draft when the saved pick or the role changes.
                key={`${m.role}:${m.pageIds?.join(",") ?? "all"}`}
                organizationId={organizationId}
                memberId={m.id}
                name={m.name}
                role={m.role}
                pageIds={m.pageIds}
                pages={pages}
              />
              <span className="text-xs text-ink-muted">Desde el {formatDate(m.joinedAt)}</span>
            </PersonRow>
          ),
        };
      })}
    />
  );
}
