import { PersonRow, SearchableList } from "@/components/ui/SearchableList";
import { listUsers } from "@/lib/admin/queries";
import { isSuperadmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { BanButton } from "./BanButton";
import { SetPasswordForm } from "./SetPasswordForm";

/** One line per account; changing the password and blocking unfold under it. */
export async function UserList({ currentUserId }: { currentUserId: string }) {
  const users = await listUsers();

  return (
    <SearchableList
      noun={{ one: "persona", many: "personas" }}
      rows={users.map((u) => {
        const isSelf = u.id === currentUserId;
        return {
          key: u.id,
          search: `${u.name} ${u.email}`,
          node: (
            <PersonRow
              summary={
                <>
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-panel text-sm font-semibold text-ink-muted"
                  >
                    {u.name.trim().charAt(0).toUpperCase() || "·"}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2">
                      <span className="truncate font-medium">{u.name}</span>
                      {isSuperadmin(u) ? <Badge>superadmin</Badge> : null}
                      {u.banned ? <Badge tone="error">bloqueado</Badge> : null}
                    </span>
                    <span className="truncate text-sm text-ink-muted">{u.email}</span>
                  </span>
                  <span className="hidden shrink-0 text-sm text-ink-muted sm:block">
                    Desde el {formatDate(u.createdAt)}
                  </span>
                </>
              }
            >
              <div className="flex flex-wrap items-start gap-2">
                <SetPasswordForm userId={u.id} userName={u.name} />
                {isSelf ? null : <BanButton userId={u.id} banned={Boolean(u.banned)} />}
              </div>
            </PersonRow>
          ),
        };
      })}
    />
  );
}

function Badge({ children, tone }: { children: string; tone?: "error" }) {
  return (
    <span
      className={
        tone === "error"
          ? "rounded-sm border border-error/40 px-1.5 text-xs font-medium text-error"
          : "rounded-sm bg-accent-soft px-1.5 text-xs font-medium text-ink"
      }
    >
      {children}
    </span>
  );
}
