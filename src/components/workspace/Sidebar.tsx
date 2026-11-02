import { Logo } from "@/components/ui/Logo";
import { MarginNote } from "@/components/ui/MarginNote";
import type { WorkspaceAccess } from "@/lib/workspace/access";
import { can } from "@/lib/workspace/access";
import type { WorkspaceSummary } from "@/lib/workspace/queries";
import { SidebarSection } from "./SidebarSection";
import { UserMenu } from "./UserMenu";
import { WorkspaceAccentPicker } from "./WorkspaceAccentPicker";
import { WorkspaceNav } from "./WorkspaceNav";

type Props = {
  access: WorkspaceAccess;
  workspaces: WorkspaceSummary[];
  user: { name: string; email: string; superadmin: boolean };
};

export function Sidebar({ access, workspaces, user }: Props) {
  return (
    <div className="flex h-full flex-col gap-7 px-4 py-6">
      <Logo className="hidden px-2 md:inline-flex" />
      <SidebarSection title="Espacios de trabajo">
        <WorkspaceNav workspaces={workspaces} currentSlug={access.slug} />
      </SidebarSection>
      {can(access.role, { settings: ["update"] }) ? (
        <SidebarSection title="Color del espacio">
          <WorkspaceAccentPicker
            key={access.organizationId}
            organizationId={access.organizationId}
            accent={access.accent}
          />
        </SidebarSection>
      ) : null}
      <SidebarSection title="Páginas">
        {/* Step 7 fills this in. */}
        <MarginNote className="px-2 text-lg">aún no hay ninguna página</MarginNote>
      </SidebarSection>
      <div className="mt-auto">
        <UserMenu {...user} />
      </div>
    </div>
  );
}
