import { CommandPalette } from "@/components/palette/CommandPalette";
import { Logo } from "@/components/ui/Logo";
import type { PageSummary } from "@/lib/pages/queries";
import type { WorkspaceAccess } from "@/lib/workspace/access";
import { can } from "@/lib/workspace/access";
import type { WorkspaceSummary } from "@/lib/workspace/queries";
import { InviteTeamCard } from "./InviteTeamCard";
import { NewPageButton } from "./NewPageButton";
import { PageTree } from "./page-tree/PageTree";
import { SidebarSection } from "./SidebarSection";
import { UserMenu } from "./UserMenu";
import { WorkspaceAccentPicker } from "./WorkspaceAccentPicker";
import { WorkspaceNav } from "./WorkspaceNav";

type Props = {
  access: WorkspaceAccess;
  workspaces: WorkspaceSummary[];
  pages: PageSummary[];
  user: { name: string; email: string; superadmin: boolean };
};

export function Sidebar({ access, workspaces, pages, user }: Props) {
  return (
    <div className="flex h-full flex-col gap-7 px-4 py-6">
      {/* On mobile the logo lives in the top bar instead. */}
      <div className="hidden px-2 md:block">
        <Logo />
      </div>
      <CommandPalette
        key={access.organizationId}
        organizationId={access.organizationId}
        slug={access.slug}
        pages={pages}
        workspaces={workspaces}
        canCreate={can(access.role, { page: ["create"] })}
      />
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
        <PageTree
          key={access.organizationId}
          organizationId={access.organizationId}
          slug={access.slug}
          pages={pages}
          canCreate={can(access.role, { page: ["create"] })}
          canMove={can(access.role, { page: ["update"] })}
        />
        {can(access.role, { page: ["create"] }) ? (
          <NewPageButton organizationId={access.organizationId} />
        ) : null}
      </SidebarSection>
      <div className="mt-auto flex flex-col gap-5">
        {can(access.role, { inviteLink: ["create"] }) ? (
          <InviteTeamCard key={access.organizationId} organizationId={access.organizationId} />
        ) : null}
        <UserMenu {...user} />
      </div>
    </div>
  );
}
