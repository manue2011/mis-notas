import { createAuthClient } from "better-auth/react";

// Sign-in and sign-up go through the /api/auth handler (not Server Actions)
// so Better Auth's rate limits apply to them.
//
// The base URL is the page's own origin. Without it Better Auth reads
// BETTER_AUTH_URL while prerendering, so a bad value there broke the build.
// The client is only ever called in the browser.
export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? "http://localhost" : window.location.origin,
});
