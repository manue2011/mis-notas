import { Suspense } from "react";
import { AuthFootnote, AuthShell, AuthTitle } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { RedirectIfSignedIn } from "@/components/auth/RedirectIfSignedIn";
import { googleEnabled } from "@/lib/env";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthTitle intro="Tus notas te están esperando donde las dejaste.">Hola de nuevo</AuthTitle>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <Suspense fallback={<div className="h-80" />}>
        <LoginForm googleEnabled={googleEnabled()} />
      </Suspense>
      <AuthFootnote>¿Aún no tienes cuenta? Pide un enlace de invitación al administrador.</AuthFootnote>
    </AuthShell>
  );
}
