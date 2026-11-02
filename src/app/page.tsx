import { Suspense } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonClasses } from "@/components/ui/Button";
import { isSuperadmin, requireUser } from "@/lib/auth/session";

// Placeholder until the app shell exists (step 6 redirects to the last workspace).
export default function Home() {
  return (
    <main className="px-6 py-16 md:px-16">
      <h1 className="font-serif text-4xl">Libreta</h1>
      <Suspense fallback={<p className="mt-4 text-ink-muted">Buscando tu cuaderno…</p>}>
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const user = await requireUser();

  return (
    <>
      <p className="mt-4 text-ink-muted">
        Hola, {user.name}. La pantalla principal está en construcción.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {isSuperadmin(user) ? (
          <Link href="/admin" className={buttonClasses("secondary")}>
            <Settings size={16} strokeWidth={1.75} aria-hidden />
            Administración
          </Link>
        ) : null}
        <SignOutButton />
      </div>
    </>
  );
}
