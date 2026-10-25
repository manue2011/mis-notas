import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { after } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { workspaceSettings } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordTemplate } from "@/lib/email/templates/reset-password";
import { verifyEmailTemplate } from "@/lib/email/templates/verify-email";
import { env } from "@/lib/env";
import { ac, roles } from "./permissions";

const ONE_HOUR = 60 * 60;

export const auth = betterAuth({
  appName: "Libreta",
  baseURL: env().BETTER_AUTH_URL,
  secret: env().BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
    // Sent after the response so response time doesn't reveal whether the email exists.
    sendResetPassword: async ({ user, url }) => {
      after(() => sendEmail(user.email, resetPasswordTemplate(user.name, url)));
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 24 * ONE_HOUR,
    sendVerificationEmail: async ({ user, url }) => {
      after(() => sendEmail(user.email, verifyEmailTemplate(user.name, url)));
    },
  },

  socialProviders: {
    google: {
      clientId: env().GOOGLE_CLIENT_ID,
      clientSecret: env().GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },

  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 10 * 60, max: 5 },
      "/request-password-reset": { window: 10 * 60, max: 3 },
      "/send-verification-email": { window: 5 * 60, max: 3 },
    },
  },

  advanced: {
    backgroundTasks: { handler: (promise) => after(promise) },
  },

  plugins: [
    organization({
      ac,
      roles,
      creatorRole: "admin",
      allowUserToCreateOrganization: true,
      organizationHooks: {
        afterCreateOrganization: async ({ organization }) => {
          await db
            .insert(workspaceSettings)
            .values({ organizationId: organization.id })
            .onConflictDoNothing();
        },
      },
    }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
