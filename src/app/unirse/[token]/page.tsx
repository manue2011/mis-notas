import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { AuthFootnote, AuthShell, AuthTitle } from "@/components/auth/AuthShell";
import { JoinButton } from "@/components/invites/JoinButton";
import { WorkspaceInviteBanner } from "@/components/invites/WorkspaceInviteBanner";
import { buttonClasses } from "@/components/ui/Button";
import { getSession } from "@/lib/auth/session";
import { findInviteLink, isWorkspaceMember } from "@/lib/invites/queries";
import { emailMatchesDomain, inviteProblemText } from "@/lib/invites/rules";

export const metadata = { title: "Unirse a un espacio" };

type Params = PageProps<"/unirse/[token]">["params"];

export default function JoinPage({ params }: { params: Params }) {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-80" />}>
        <JoinContent params={params} />
      </Suspense>
    </AuthShell>
  );
}

async function JoinContent({ params }: { params: Params }) {
  const { token } = await params;
  const [invite, session] = await Promise.all([findInviteLink(token), getSession()]);

  if (!invite) {
    return (
      <Message title="Enlace no válido">
        Este enlace no lleva a ningún espacio. Puede que esté mal copiado: pide otro a quien te lo
        mandó.
      </Message>
    );
  }

  const banner = (
    <WorkspaceInviteBanner
      inviterName={invite.inviterName}
      workspaceName={invite.workspaceName}
      accent={invite.accent}
      role={invite.role}
    />
  );

  if (session) {
    if (await isWorkspaceMember(invite.organizationId, session.user.id)) {
      return (
        <>
          {banner}
          <Message title="Ya estás dentro">
            Ya formas parte de {invite.workspaceName}.
            <Link href={`/espacio/${invite.slug}`} className={buttonClasses("primary", "mt-6 w-full")}>
              Ir al espacio
            </Link>
          </Message>
        </>
      );
    }
  }

  if (invite.problem) {
    return (
      <>
        {banner}
        <Message title="Este enlace ya no sirve">{inviteProblemText[invite.problem]}</Message>
      </>
    );
  }

  if (!session) {
    const next = encodeURIComponent(`/unirse/${token}`);
    return (
      <>
        {banner}
        <AuthTitle intro="Entra con tu cuenta para unirte.">Únete al espacio</AuthTitle>
        <Link href={`/iniciar-sesion?next=${next}`} className={buttonClasses("primary", "w-full")}>
          Iniciar sesión para unirme
        </Link>
        <AuthFootnote>
          ¿No tienes cuenta? Libreta funciona por invitación: pide antes un enlace de registro al
          administrador y vuelve a abrir este enlace.
        </AuthFootnote>
      </>
    );
  }

  if (!emailMatchesDomain(session.user.email, invite.allowedEmailDomain)) {
    return (
      <>
        {banner}
        <Message title="Este enlace no es para tu correo">{inviteProblemText.domain}</Message>
      </>
    );
  }

  return (
    <>
      {banner}
      <AuthTitle intro={`Entrarás con tu cuenta (${session.user.email}).`}>Únete al espacio</AuthTitle>
      <JoinButton token={token} workspaceName={invite.workspaceName} />
    </>
  );
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <AuthTitle>{title}</AuthTitle>
      <div className="flex flex-col font-serif text-xl leading-snug">{children}</div>
    </>
  );
}
