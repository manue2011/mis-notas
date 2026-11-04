import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// A short-lived pass to edit (or read) one page over the real-time server.
// Vercel issues it after checking membership; the server on Render only has
// to verify the signature. Shared by both, so: no Next.js or DB imports here.

export const TICKET_TTL_SECONDS = 5 * 60;

const ticketSchema = z.object({
  userId: z.string().min(1),
  name: z.string(),
  organizationId: z.string().min(1),
  pageId: z.uuid(),
  canEdit: z.boolean(),
  /** Expiry, seconds since the epoch. */
  exp: z.number().int(),
});

export type Ticket = z.infer<typeof ticketSchema>;

const sign = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("base64url");

export function issueTicket(data: Omit<Ticket, "exp">, secret: string, now = Date.now()): string {
  const ticket: Ticket = { ...data, exp: Math.floor(now / 1000) + TICKET_TTL_SECONDS };
  const body = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

/** The ticket if the signature is right and it hasn't expired; otherwise null. */
export function verifyTicket(token: string, secret: string, now = Date.now()): Ticket | null {
  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length) return null;
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const parsed = ticketSchema.safeParse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
    if (!parsed.success || parsed.data.exp * 1000 < now) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
