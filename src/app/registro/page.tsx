import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { RedirectIfSignedIn } from "@/components/auth/RedirectIfSignedIn";
import { SignupGate } from "@/components/auth/SignupGate";
import { googleEnabled } from "@/lib/env";

export const metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <Suspense fallback={<div className="h-[32rem]" />}>
        <SignupGate googleEnabled={googleEnabled()} />
      </Suspense>
    </AuthShell>
  );
}
