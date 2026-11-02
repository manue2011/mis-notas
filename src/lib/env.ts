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
  // Empty values count as unset; stray spaces and quotes (easy to paste into
  // a hosting dashboard) are dropped.
  const raw: Record<string, string> = Object.fromEntries(
    Object.entries(process.env)
      .map(([key, value]) => [key, value?.trim().replace(/^(["'])(.*)\1$/, "$2")] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );
  // On Vercel, fall back to the project's production domain.
  if (!isUrl(raw.BETTER_AUTH_URL) && raw.VERCEL_PROJECT_PRODUCTION_URL) {
    raw.BETTER_AUTH_URL = `https://${raw.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment variables: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

function isUrl(value: string | undefined): boolean {
  return z.url().safeParse(value).success;
}

export function googleEnabled(): boolean {
  return Boolean(env().GOOGLE_CLIENT_ID);
}
