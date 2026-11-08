import { z } from "zod";

// The real-time server's environment. When bundling (realtime/build.mjs),
// imports of "@/lib/env" from shared code resolve here instead, so the
// server needs only these variables — not the app's auth secrets.

const optional = z.string().min(1).optional();

const envSchema = z.object({
  DATABASE_URL: z.url(),
  /** Same value as REALTIME_SECRET on Vercel: verifies page tickets. */
  REALTIME_SECRET: z.string().trim().min(32),
  PORT: z.coerce.number().int().positive().default(1234),
  // Needed to check screenshots and delete unused images.
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const raw = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => Boolean(entry[1]?.trim())),
  );
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment variables: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
