import { ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { roleLabel } from "@/lib/members/roles";
import { scopeSummary } from "@/lib/pages/scope-summary";
import type { FlatPage } from "@/lib/pages/tree";
import { RevokeAllLinksButton } from "./RevokeAllLinksButton";
import { RevokeLinkButton } from "./RevokeLinkButton";

type Link = {
  id: string;
  role: string;
  expiresAt: Date;
  maxUses: number | null;
  uses: number;
  pageIds: string[] | null;
  createdAt: Date;
  creatorName: string | null;
};

type Props = { organizationId: string; links: Link[]; pages: FlatPage[] };

// The newest ones are shown; the rest fold away so a busy week doesn't bury the page.
const SHOWN = 5;

const listClass = "flex flex-col divide-y divide-dashed divide-border border-y border-dashed border-border";

/** Links that still let people in, each with "Anular", and "Anular todos". */
export function ActiveInviteLinks({ organizationId, links, pages }: Props) {
  if (links.length === 0) {
    return <p className="text-sm text-ink-muted">No hay enlaces activos: ahora mismo nadie puede entrar con uno.</p>;
  }
  const rest = links.slice(SHOWN);
  const row = (link: Link) => <LinkRow key={link.id} organizationId={organizationId} link={link} pages={pages} />;

  return (
    <div className="flex flex-col gap-3">
      <ul className={listClass}>{links.slice(0, SHOWN).map(row)}</ul>
      {rest.length ? (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm text-ink-muted hover:text-ink [&::-webkit-details-marker]:hidden">
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              aria-hidden
              className="transition-transform group-open:rotate-90 motion-reduce:transition-none"
            />
            <span className="group-open:hidden">
              Ver {rest.length === 1 ? "el otro enlace" : `los otros ${rest.length} enlaces`}
            </span>
            <span className="hidden group-open:inline">Ocultar los más antiguos</span>
          </summary>
          <ul className={listClass}>{rest.map(row)}</ul>
        </details>
      ) : null}
      {links.length > 1 ? <RevokeAllLinksButton organizationId={organizationId} count={links.length} /> : null}
    </div>
  );
}

function LinkRow({ organizationId, link, pages }: { organizationId: string; link: Link; pages: FlatPage[] }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex flex-col text-sm">
        <span className="font-medium">
          {roleLabel(link.role)} · caduca el {formatDate(link.expiresAt)}
        </span>
        <span>Ven: {link.role === "admin" ? "Todo el cuaderno" : scopeSummary(pages, link.pageIds)}</span>
        <span className="text-ink-muted">
          {link.maxUses === null
            ? `${link.uses} ${link.uses === 1 ? "uso" : "usos"}, sin límite`
            : `${link.uses} de ${link.maxUses} ${link.maxUses === 1 ? "uso" : "usos"}`}
          {link.creatorName ? ` · lo creó ${link.creatorName}` : ""}
        </span>
      </div>
      <RevokeLinkButton organizationId={organizationId} linkId={link.id} />
    </li>
  );
}
