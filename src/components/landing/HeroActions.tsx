import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { getSession } from "@/lib/auth/session";
import { APP_HOME } from "@/lib/invites/rules";

/** Main call to action. Reads the session, so render it inside <Suspense>. */
export async function HeroActions() {
  const session = await getSession();

  if (session) {
    return (
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href={APP_HOME} className={buttonClasses("primary", "px-6")}>
          Abrir mis libretas
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
        </Link>
        <p className="text-sm text-ink-muted">Hola de nuevo, {session.user.name}.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
      <Link href="/iniciar-sesion" className={buttonClasses("primary", "px-6")}>
        Iniciar sesión
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
      </Link>
      <p className="max-w-xs text-sm text-ink-muted">
        Libreta funciona por invitación. ¿Te han invitado? Abre el enlace que te mandaron.
      </p>
    </div>
  );
}
