import { Suspense } from "react";
import { AccentScope } from "@/components/ui/AccentScope";
import { RealtimeWarmup } from "@/components/workspace/RealtimeWarmup";
import { RememberWorkspace } from "@/components/workspace/RememberWorkspace";
import { Sidebar } from "@/components/workspace/Sidebar";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { isSuperadmin, requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { listPages } from "@/lib/pages/queries";
import { requireWorkspaceBySlug } from "@/lib/workspace/access";
import { listMyWorkspaces } from "@/lib/workspace/queries";

export default function WorkspaceLayout({ children, params }: LayoutProps<"/espacio/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <WorkspaceShell params={params}>{children}</WorkspaceShell>
    </Suspense>
  );
}

async function WorkspaceShell({
  params,
  children,
}: {
  params: LayoutProps<"/espacio/[slug]">["params"];
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const [access, workspaces, pages, user] = await Promise.all([
    requireWorkspaceBySlug(slug),
    listMyWorkspaces(),
    listPages(slug),
    requireUser(),
  ]);

  return (
    <AccentScope accent={access.accent} font={access.font}>
      <RememberWorkspace organizationId={access.organizationId} />
      {env().REALTIME_URL ? <RealtimeWarmup healthUrl={healthUrlOf(env().REALTIME_URL!)} /> : null}
      <WorkspaceFrame
        sidebar={
          <Sidebar
            access={access}
            workspaces={workspaces}
            pages={pages}
            user={{ name: user.name, email: user.email, superadmin: isSuperadmin(user) }}
          />
        }
      >
        {children}
      </WorkspaceFrame>
    </AccentScope>
  );
}

/** wss://host/… → https://host/health (and ws → http locally). */
function healthUrlOf(realtimeUrl: string): string {
  const url = new URL(realtimeUrl);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "/health";
  return url.toString();
}
