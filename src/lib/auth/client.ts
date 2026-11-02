import { createAuthClient } from "better-auth/react";

// Sign-in and sign-up go through the /api/auth handler (not Server Actions)
// so Better Auth's rate limits apply to them.
export const authClient = createAuthClient();
