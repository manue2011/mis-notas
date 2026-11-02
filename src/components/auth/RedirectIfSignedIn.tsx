import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/** Sends people who already have a session to the app. Render inside <Suspense>. */
export async function RedirectIfSignedIn() {
  if (await getSession()) redirect("/");
  return null;
}
