import { formatDate } from "@/lib/format";
import type { MemberRow } from "@/lib/members/queries";
import type { FlatPage } from "@/lib/pages/tree";
import { MemberControls } from "./MemberControls";
import { MemberPages } from "./MemberPages";

type Props = { organizationId: string; members: MemberRow[]; currentUserId: string; pages: FlatPage[] };

export function MembersList({ organizationId, members, currentUserId, pages }: Props) {
  return (
    <ul className="flex flex-col divide-y divide-dashed divide-border border-y border-dashed border-border">
      {members.map((m) => {
        const isSelf = m.userId === currentUserId;
        return (
          <li key={m.id} className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-panel text-sm font-semibold text-ink-muted"
                >
                  {m.name.trim().charAt(0).toUpperCase() || "·"}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">
                    {m.name}
                    {isSelf ? <span className="ml-2 font-hand text-lg font-normal text-ink-muted">(tú)</span> : null}
                  </span>
                  <span className="truncate text-sm text-ink-muted">{m.email}</span>
                  <span className="text-xs text-ink-muted">Desde el {formatDate(m.joinedAt)}</span>
                </div>
              </div>
              <MemberControls
                organizationId={organizationId}
                memberId={m.id}
                name={m.name}
                role={m.role}
                isSelf={isSelf}
              />
            </div>
            <div className="sm:pl-12">
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}
