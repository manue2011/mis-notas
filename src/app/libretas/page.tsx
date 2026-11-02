import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listMyWorkspaces } from "@/lib/workspace/queries";

export const metadata = { title: "Mis libretas" };

// Sends people to the last workspace they opened, or to create their first one.
export default function MyNotebooks() {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-ink-muted md:px-16">Buscando tu cuaderno…</p>}>
      <GoToWorkspace />
    </Suspense>
  );
}

async function GoToWorkspace() {
  const session = await getSession();
  if (!session) redirect("/iniciar-sesion?next=/libretas");

  const workspaces = await listMyWorkspaces();
  if (workspaces.length === 0) redirect("/nuevo-espacio");

  const last =
    workspaces.find((w) => w.id === session.session.activeOrganizationId) ?? workspaces[0];
  redirect(`/espacio/${last.slug}`);
  return null;
}
