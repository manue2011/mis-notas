import { Suspense } from "react";
import { AccentScope } from "@/components/ui/AccentScope";
import { RememberWorkspace } from "@/components/workspace/RememberWorkspace";
import { Sidebar } from "@/components/workspace/Sidebar";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { isSuperadmin, requireUser } from "@/lib/auth/session";
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
    <AccentScope accent={access.accent}>
      <RememberWorkspace organizationId={access.organizationId} />
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
