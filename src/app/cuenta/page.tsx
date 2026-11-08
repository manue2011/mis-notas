import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AccentScope } from "@/components/ui/AccentScope";
import { buttonClasses } from "@/components/ui/Button";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { isSuperadmin, requireUser } from "@/lib/auth/session";
import { APP_HOME } from "@/lib/invites/rules";

export const metadata = { title: "Mi cuenta" };

export default function AccountPage() {
  return (
    <AccentScope accent={DEFAULT_ACCENT} className="min-h-screen">
      <SiteHeader />
      <main className="max-w-4xl px-6 pt-2 pb-16 sm:px-12 lg:px-20">
        <Suspense fallback={<div className="h-[32rem]" />}>
          <AccountContent />
        </Suspense>
      </main>
      <LandingFooter />
    </AccentScope>
  );
}

async function AccountContent() {
  const me = await requireUser();
  const superadmin = isSuperadmin(me);

  return (
    <>
      <Link
        href={APP_HOME}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1.5 rounded-md px-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
        Volver a mis libretas
      </Link>
      <h1 className="mt-6 mb-10 inline-block font-serif text-4xl font-medium tracking-tight">
        Mi cuenta
        <HandUnderline className="mt-1" />
      </h1>

      <SettingsSection id="perfil" title="Tú" description="Cómo te ven tus compañeros.">
        <p className="font-medium">{me.name}</p>
        <p className="text-sm break-all text-ink-muted">{me.email}</p>
      </SettingsSection>

      <SettingsSection
        id="datos"
        title="Tus datos"
        description={
          <>
            Todo lo que Libreta guarda de ti, en un archivo. Más detalles en{" "}
            <Link href="/privacidad" className="underline underline-offset-4 hover:text-ink">
              Privacidad
            </Link>
            .
          </>
        }
      >
        <p className="mb-4 text-sm">
          Tu cuenta, tus espacios, las páginas que has creado (con su contenido), las imágenes que has subido y tus
          sesiones abiertas, en formato JSON.
        </p>
        <a href="/cuenta/datos" download className={buttonClasses("secondary")}>
          <Download size={16} strokeWidth={1.75} aria-hidden />
          Descargar mis datos
        </a>
      </SettingsSection>

      <SettingsSection
        id="eliminar"
        title="Eliminar la cuenta"
        description="Se borra al momento y no se puede deshacer."
      >
        <ul className="mb-5 flex list-disc flex-col gap-1.5 pl-5 text-sm">
          <li>Los espacios donde eres la única persona se borran contigo, con sus páginas e imágenes.</li>
          <li>En los espacios compartidos, tus páginas se quedan para el equipo, sin tu nombre.</li>
          <li>Si eres el único administrador de un espacio con más gente, primero nombra a otra persona.</li>
        </ul>
        {superadmin ? (
          <p className="text-sm text-ink-muted">
            Eres el administrador de Libreta: esta cuenta no se puede eliminar desde aquí.
          </p>
        ) : (
          <DeleteAccountForm email={me.email} />
        )}
      </SettingsSection>
    </>
  );
}
