import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { organization } from "better-auth/plugins/organization";
import { after } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { workspaceSettings } from "@/db/schema";
import { env } from "@/lib/env";
import { adminAccess, appRoles, SUPERADMIN_ROLE } from "./admin-permissions";
import { ac, roles } from "./permissions";
import { validateUserInfo } from "./signup-gate";
import { recordSignupInviteUser, SIGNUP_COOKIE } from "./signup-invite";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env();

export const auth = betterAuth({
  appName: "Libreta",
  baseURL: env().BETTER_AUTH_URL,
  secret: env().BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),

  // No emails are sent: sign-up is invite-only and the superadmin resets
  // forgotten passwords from /admin.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  socialProviders:
    GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            prompt: "select_account",
          },
        }
      : {},

  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },

  user: { validateUserInfo },

  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          const token = ctx?.getCookie(SIGNUP_COOKIE);
          if (!token) return;
          await recordSignupInviteUser(token, user.id);
          ctx?.setCookie(SIGNUP_COOKIE, "", { path: "/", maxAge: 0 });
        },
      },
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 10 * 60, max: 5 },
    },
  },

  advanced: {
    backgroundTasks: { handler: (promise) => after(promise) },
  },

  plugins: [
    admin({
      ac: adminAccess,
      roles: appRoles,
      adminRoles: [SUPERADMIN_ROLE],
      defaultRole: "user",
      bannedUserMessage: "Tu cuenta está bloqueada. Habla con el administrador.",
    }),
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
