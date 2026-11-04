import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ActiveInviteLinks } from "@/components/settings/ActiveInviteLinks";
import { AllowedDomainForm } from "@/components/settings/AllowedDomainForm";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import { InviteLinkCreator } from "@/components/settings/InviteLinkCreator";
import { MembersList } from "@/components/settings/MembersList";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { TopBar } from "@/components/workspace/TopBar";
import { WorkspaceAccentPicker } from "@/components/workspace/WorkspaceAccentPicker";
import { listActiveInviteLinks } from "@/lib/invites/queries";
import { emailMatchesDomain } from "@/lib/invites/rules";
import { listMembers } from "@/lib/members/queries";
import { can, requireWorkspaceBySlug } from "@/lib/workspace/access";
import { getAllowedDomain } from "@/lib/workspace/queries";

type Props = PageProps<"/espacio/[slug]/ajustes">;

export default function SettingsPage(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-16 border-b border-dashed border-border" />}>
      <SettingsScreen {...props} />
    </Suspense>
  );
}

async function SettingsScreen({ params }: Props) {
  const { slug } = await params;
  const access = await requireWorkspaceBySlug(slug);
  // Only the workspace's admins; to everyone else the page doesn't exist.
  if (!can(access.role, { settings: ["update"] })) notFound();
  const [members, links, domain] = await Promise.all([
    listMembers(access.organizationId),
    listActiveInviteLinks(access.organizationId),
    getAllowedDomain(access.organizationId),
  ]);
  const outsideDomain = domain ? members.filter((m) => !emailMatchesDomain(m.email, domain)).length : 0;

  return (
    <>
      <TopBar crumbs={[{ label: access.name, href: `/espacio/${access.slug}` }, { label: "Ajustes" }]} />
      <div className="w-full max-w-4xl px-6 py-12 md:px-16">
        <h1 className="inline-block font-serif text-4xl font-medium tracking-tight">
          Ajustes del espacio
          <HandUnderline className="mt-1" />
        </h1>
        <div className="mt-10">
          <SettingsSection id="general" title="General" description="Cómo se llama el espacio y cómo se ve.">
            <div className="flex flex-col gap-8">
              <GeneralSettingsForm
                organizationId={access.organizationId}
                name={access.name}
                icon={access.icon}
                font={access.font}
                accent={access.accent}
              />
              <div className="flex flex-col gap-2 border-t border-dashed border-border pt-6">
                <p className="text-sm font-medium">Color</p>
                <WorkspaceAccentPicker organizationId={access.organizationId} accent={access.accent} />
                <p className="text-sm text-ink-muted">Se guarda al momento, como en la barra lateral.</p>
              </div>
            </div>
          </SettingsSection>
          <SettingsSection
            id="acceso"
            title="Acceso"
            description="Limita quién puede entrar con un enlace de invitación según el dominio de su correo."
          >
            <div className="flex flex-col gap-4">
              <AllowedDomainForm organizationId={access.organizationId} domain={domain} />
              {outsideDomain > 0 ? (
                <p className="max-w-md text-sm text-ink-muted">
                  {outsideDomain === 1
                    ? "1 miembro actual tiene un correo de otro dominio: sigue dentro."
                    : `${outsideDomain} miembros actuales tienen un correo de otro dominio: siguen dentro.`}{" "}
                  La regla solo se aplica a quien entra a partir de ahora.
                </p>
              ) : null}
            </div>
          </SettingsSection>
          <SettingsSection
            id="miembros"
            title="Miembros"
            description={
              <>
                Los <strong className="font-medium text-ink">lectores</strong> solo leen; los{" "}
                <strong className="font-medium text-ink">editores</strong> crean, editan y borran páginas; los{" "}
                <strong className="font-medium text-ink">administradores</strong>, además, llevan estos ajustes.
              </>
            }
          >
            <MembersList
              organizationId={access.organizationId}
              members={members}
              currentUserId={access.userId}
            />
          </SettingsSection>
          <SettingsSection
            id="invitaciones"
            title="Invitaciones"
            description="Enlaces para que tu equipo entre en el espacio. Quien no tenga cuenta en Libreta necesitará además un enlace de registro."
          >
            <div className="flex flex-col gap-8">
              <InviteLinkCreator organizationId={access.organizationId} />
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Enlaces activos</h3>
                <ActiveInviteLinks organizationId={access.organizationId} links={links} />
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>
    </>
  );
}
