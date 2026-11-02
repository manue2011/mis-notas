import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { APP_HOME, safeNextPath } from "@/lib/invites/rules";

type Props = {
  /** The page's searchParams, to honor ?next= (only same-site paths). */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Sends people who already have a session on to the app. Render inside <Suspense>. */
export async function RedirectIfSignedIn({ searchParams }: Props) {
  if (!(await getSession())) return null;
  const next = (await searchParams)?.next;
  redirect(safeNextPath(typeof next === "string" ? next : null) ?? APP_HOME);
}
