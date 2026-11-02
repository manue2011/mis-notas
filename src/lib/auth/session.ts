import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { SUPERADMIN_ROLE } from "./admin-permissions";

// Reads the request, so callers must render inside a <Suspense> boundary.
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/iniciar-sesion");
  return session.user;
}

export function isSuperadmin(user: { role?: string | null }): boolean {
  return user.role?.split(",").includes(SUPERADMIN_ROLE) ?? false;
}

export async function requireSuperadmin() {
  const user = await requireUser();
  // 404 rather than 403, so the admin area doesn't reveal it exists.
  if (!isSuperadmin(user)) notFound();
  return user;
}
