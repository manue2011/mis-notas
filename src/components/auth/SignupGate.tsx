import { cookies } from "next/headers";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { isSignupInviteUsable, SIGNUP_COOKIE } from "@/lib/auth/signup-invite";
import { SignupForm } from "./SignupForm";

/** Shows the sign-up form only to someone holding a usable invite. Render inside <Suspense>. */
export async function SignupGate({ googleEnabled }: { googleEnabled: boolean }) {
  const token = (await cookies()).get(SIGNUP_COOKIE)?.value;
  const usable = token ? await isSignupInviteUsable(token) : false;

  if (!usable) return <InvalidInvite />;
  return (
    <>
      <p className="-mt-2 mb-8 text-ink-muted">Te han invitado a Libreta. Ya solo falta tu cuenta.</p>
      <SignupForm googleEnabled={googleEnabled} />
    </>
  );
}

function InvalidInvite() {
  return (
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
  );
}
