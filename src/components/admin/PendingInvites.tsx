import { listPendingInvites } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";
import { RevokeInviteButton } from "./RevokeInviteButton";

export async function PendingInvites() {
  const invites = await listPendingInvites();

  if (invites.length === 0) {
    return (
      <p className="text-ink-muted">
        No hay enlaces esperando a nadie. Cuando crees uno, aparecerá aquí hasta que lo usen.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {invites.map((invite) => (
        <li key={invite.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
          <div>
            <p className="font-medium">{invite.note ?? "Sin nota"}</p>
            <p className="text-sm text-ink-muted">Caduca el {formatDate(invite.expiresAt)}</p>
          </div>
          <RevokeInviteButton inviteId={invite.id} />
        </li>
      ))}
    </ul>
  );
}
