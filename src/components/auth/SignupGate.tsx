import { cookies } from "next/headers";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { findUsableSignupInvite, SIGNUP_COOKIE } from "@/lib/auth/signup-invite";
import { AuthFootnote, AuthTitle } from "./AuthShell";
import { InviteBanner } from "./InviteBanner";
import { SignupForm } from "./SignupForm";

/** Shows the sign-up form only to someone holding a usable invite. Render inside <Suspense>. */
export async function SignupGate({ googleEnabled }: { googleEnabled: boolean }) {
  const token = (await cookies()).get(SIGNUP_COOKIE)?.value;
  const invite = token ? await findUsableSignupInvite(token) : null;

  if (!invite) return <InvalidInvite />;
  return (
    <>
      <InviteBanner inviterName={invite.inviterName} />
      <AuthTitle>Crea tu cuenta</AuthTitle>
      <SignupForm googleEnabled={googleEnabled} />
      <AuthFootnote>
        ¿Ya tienes cuenta?{" "}
        <Link href="/iniciar-sesion" className="font-medium text-accent-ink underline underline-offset-4">
          Entrar
        </Link>
      </AuthFootnote>
    </>
  );
}

function InvalidInvite() {
  return (
    <>
      <AuthTitle>Crea tu cuenta</AuthTitle>
      <div className="flex flex-col items-start gap-4">
        <p className="font-serif text-xl leading-snug">
          Esta puerta solo se abre con un enlace de invitación, y el tuyo no aparece o ya no sirve.
        </p>
        <p className="text-ink-muted">
          Los enlaces caducan a los 7 días y se pueden usar una sola vez. Pide uno nuevo al
          administrador.
        </p>
        <Link href="/iniciar-sesion" className={buttonClasses("secondary", "mt-2")}>
          Ya tengo cuenta
        </Link>
      </div>
    </>
  );
}
