import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InviteCreator } from "@/components/admin/InviteCreator";
import { PendingInvites } from "@/components/admin/PendingInvites";
import { UserList } from "@/components/admin/UserList";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AccentScope } from "@/components/ui/AccentScope";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { requireSuperadmin } from "@/lib/auth/session";
import { APP_HOME } from "@/lib/invites/rules";

export const metadata = { title: "Administración" };

export default function AdminPage() {
  return (
    <AccentScope accent={DEFAULT_ACCENT} className="min-h-screen">
      {/* Gives the way out: logo home, "Mis libretas" and "Cerrar sesión". */}
      <SiteHeader />
      <main className="max-w-3xl px-6 pt-2 pb-16 sm:px-12 lg:px-20">
        <Link
          href={APP_HOME}
          className="-ml-2 flex min-h-11 w-fit items-center gap-1.5 rounded-md px-2 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          Volver a mis libretas
        </Link>
        <h1 className="mt-6 inline-block font-serif text-4xl font-medium tracking-tight">
          Administración
          <HandUnderline className="mt-1" />
        </h1>
        <Suspense fallback={<p className="mt-10 text-ink-muted">Abriendo el archivador…</p>}>
          <AdminContent />
        </Suspense>
      </main>
    </AccentScope>
  );
}

async function AdminContent() {
  const admin = await requireSuperadmin();

  return (
    <>
      <Section
        title="Invitar a alguien"
        description="Crea un enlace de registro y mándaselo como prefieras. Nadie puede crear una cuenta sin uno."
      >
        <InviteCreator />
      </Section>
      <Section title="Enlaces pendientes">
        <PendingInvites />
      </Section>
      <Section title="Personas" description="Si alguien olvida su contraseña, cámbiala aquí y pásasela.">
        <UserList currentUserId={admin.id} />
      </Section>
    </>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-serif text-2xl font-medium">{title}</h2>
      {description ? <p className="mt-1 text-ink-muted">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
