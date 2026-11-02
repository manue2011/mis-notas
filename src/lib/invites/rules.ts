export const INVITE_LINK_TTL_DAYS = 7;

export type InviteProblem = "revoked" | "expired" | "used_up" | "domain";

export const inviteProblemText: Record<InviteProblem, string> = {
  revoked: "Este enlace se anuló. Pide uno nuevo a quien te invitó.",
  expired: "Este enlace caducó. Pide uno nuevo a quien te invitó.",
  used_up: "Este enlace ya se usó todas las veces que permitía.",
  domain: "Este espacio solo admite correos de su dominio, y el tuyo no coincide.",
};

type LinkState = {
  revokedAt: Date | null;
  expiresAt: Date;
  maxUses: number | null;
  uses: number;
};

/** Why a link can't be used right now, or null if it can. */
export function linkProblem(link: LinkState, now = new Date()): Exclude<InviteProblem, "domain"> | null {
  if (link.revokedAt) return "revoked";
  if (link.expiresAt <= now) return "expired";
  if (link.maxUses !== null && link.uses >= link.maxUses) return "used_up";
  return null;
}

export function emailMatchesDomain(email: string, allowedDomain: string | null): boolean {
  if (!allowedDomain) return true;
  return email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase().replace(/^@/, "")}`);
}

/** Only same-site paths, so ?next= can't send people to another site. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
