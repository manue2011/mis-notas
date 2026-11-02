import { z } from "zod";

// No "server-only" import here: the Better Auth CLI loads this module outside
// Next.js. Secrets are still safe because non-NEXT_PUBLIC vars never reach
// the client bundle.

const optional = z.string().min(1).optional();

const envSchema = z
  .object({
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    // Google sign-in is turned on only when both are set.
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    // Required by the upload code, which checks them when it runs.
    CLOUDINARY_CLOUD_NAME: optional,
    CLOUDINARY_API_KEY: optional,
    CLOUDINARY_API_SECRET: optional,
  })
  .refine((e) => !e.GOOGLE_CLIENT_ID === !e.GOOGLE_CLIENT_SECRET, {
    path: ["GOOGLE_CLIENT_SECRET"],
    message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together",
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

// Parsed lazily so that importing this module never breaks a build step
// that doesn't touch secrets.
export function env(): Env {
  if (cached) return cached;
  // Empty values in .env files count as unset.
  const raw = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== ""),
  );
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment variables: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

export function googleEnabled(): boolean {
  return Boolean(env().GOOGLE_CLIENT_ID);
}
