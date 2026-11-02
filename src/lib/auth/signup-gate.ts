import type { BetterAuthOptions } from "better-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { claimSignupInvite, SIGNUP_COOKIE } from "./signup-invite";

type ValidateUserInfo = NonNullable<NonNullable<BetterAuthOptions["user"]>["validateUserInfo"]>;

/**
 * Sign-up is invite-only. A new account (email or Google) is created only when
 * the request carries a usable invite token in the signup cookie, which
 * /invitacion/[token] sets.
 */
export const validateUserInfo: ValidateUserInfo = async ({ user: incoming, source }, ctx) => {
  if (source.action === "create-user") {
    const token = ctx.getCookie(SIGNUP_COOKIE);
    if (!token || !(await claimSignupInvite(token))) {
      return {
        error: "invite_required",
        errorDescription: "Necesitas un enlace de invitación válido para crear una cuenta.",
      };
    }
    return;
  }

  // Emails are never verified, so whoever registered a password account first
  // might not own that address. Don't let a Google login attach itself to it.
  if (source.action === "link-account" && typeof incoming.email === "string") {
    const [existing] = await db
      .select({ emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.email, incoming.email.toLowerCase()))
      .limit(1);
    if (existing && !existing.emailVerified) {
      return {
        error: "use_password",
        errorDescription: "Esta cuenta se creó con contraseña. Entra con tu correo y contraseña.",
      };
    }
  }
};
