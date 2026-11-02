import { listUsers } from "@/lib/admin/queries";
import { isSuperadmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { BanButton } from "./BanButton";
import { SetPasswordForm } from "./SetPasswordForm";

export async function UserList({ currentUserId }: { currentUserId: string }) {
  const users = await listUsers();

  return (
    <ul className="divide-y divide-border border-y border-border">
      {users.map((u) => {
        const isSelf = u.id === currentUserId;
        return (
          <li key={u.id} className="flex flex-col gap-3 py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-medium">{u.name}</p>
              <p className="text-sm text-ink-muted">{u.email}</p>
              {isSuperadmin(u) ? <Badge>superadmin</Badge> : null}
              {u.banned ? <Badge tone="error">bloqueado</Badge> : null}
              <p className="text-sm text-ink-muted sm:ml-auto">Desde el {formatDate(u.createdAt)}</p>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <SetPasswordForm userId={u.id} userName={u.name} />
              {isSelf ? null : <BanButton userId={u.id} banned={Boolean(u.banned)} />}
            </div>
          </li>
        );
      })}
    </ul>
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
