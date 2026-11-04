import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { TopBar } from "@/components/workspace/TopBar";
import { WorkspaceAccentPicker } from "@/components/workspace/WorkspaceAccentPicker";
import { can, requireWorkspaceBySlug } from "@/lib/workspace/access";

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
        </div>
      </div>
    </>
  );
}
