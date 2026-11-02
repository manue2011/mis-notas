import Link from "next/link";
import { BookOpen, Settings } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonClasses } from "@/components/ui/Button";
import { getSession, isSuperadmin } from "@/lib/auth/session";
import { APP_HOME } from "@/lib/invites/rules";

/**
 * Top-right links: "Iniciar sesión" for visitors; "Mis libretas",
 * "Administración" (superadmin only) and "Cerrar sesión" once signed in.
 * Reads the session, so render it inside <Suspense>.
 */
export async function SessionNav() {
  const session = await getSession();

  if (!session) {
    return (
      <Link href="/iniciar-sesion" className={buttonClasses("primary")}>
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {isSuperadmin(session.user) ? (
        <Link href="/admin" className={buttonClasses("ghost")}>
          <Settings size={16} strokeWidth={1.75} aria-hidden />
          Administración
        </Link>
      ) : null}
      <SignOutButton />
      <Link href={APP_HOME} className={buttonClasses("primary")}>
        <BookOpen size={16} strokeWidth={1.75} aria-hidden />
        Mis libretas
      </Link>
    </div>
  );
}
