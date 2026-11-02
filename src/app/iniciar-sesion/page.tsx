import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { RedirectIfSignedIn } from "@/components/auth/RedirectIfSignedIn";
import { googleEnabled } from "@/lib/env";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <AuthShell title="Hola de nuevo" intro="Entra para seguir donde lo dejaste.">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <Suspense fallback={<div className="h-80" />}>
        <LoginForm googleEnabled={googleEnabled()} />
      </Suspense>
      <p className="mt-10 text-sm text-ink-muted">
        ¿Aún no tienes cuenta? Libreta funciona por invitación: pide un enlace al administrador.
      </p>
    </AuthShell>
  );
}
