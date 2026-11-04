import { formatDate } from "@/lib/format";
import { roleLabel } from "@/lib/members/roles";
import { RevokeLinkButton } from "./RevokeLinkButton";

type Link = {
  id: string;
  role: string;
  expiresAt: Date;
  maxUses: number | null;
  uses: number;
  createdAt: Date;
  creatorName: string | null;
};

/** Links that still let people in, each with "Anular". */
export function ActiveInviteLinks({ organizationId, links }: { organizationId: string; links: Link[] }) {
  if (links.length === 0) {
    return <p className="text-sm text-ink-muted">No hay enlaces activos: ahora mismo nadie puede entrar con uno.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-dashed divide-border border-y border-dashed border-border">
      {links.map((link) => (
        <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-col text-sm">
            <span className="font-medium">
              {roleLabel(link.role)} · caduca el {formatDate(link.expiresAt)}
            </span>
            <span className="text-ink-muted">
              {link.maxUses === null
                ? `${link.uses} ${link.uses === 1 ? "uso" : "usos"}, sin límite`
                : `${link.uses} de ${link.maxUses} ${link.maxUses === 1 ? "uso" : "usos"}`}
              {link.creatorName ? ` · lo creó ${link.creatorName}` : ""}
            </span>
          </div>
          <RevokeLinkButton organizationId={organizationId} linkId={link.id} />
        </li>
      ))}
    </ul>
  );
}
