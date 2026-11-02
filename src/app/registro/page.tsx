import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { RedirectIfSignedIn } from "@/components/auth/RedirectIfSignedIn";
import { SignupGate } from "@/components/auth/SignupGate";
import { googleEnabled } from "@/lib/env";

export const metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <AuthShell title="Crear cuenta">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <SignupGate googleEnabled={googleEnabled()} />
      </Suspense>
    </AuthShell>
  );
}
