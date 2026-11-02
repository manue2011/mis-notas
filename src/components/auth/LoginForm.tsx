"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/error-messages";
import { FormAlert } from "./FormAlert";
import { ForgotPasswordHint } from "./ForgotPasswordHint";
import { GoogleButton } from "./GoogleButton";
import { OrDivider } from "./OrDivider";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  // Google sends errors back as ?error=<code>.
  const callbackError = useSearchParams().get("error");
  const [error, setError] = useState<string | null>(
    callbackError ? authErrorMessage(callbackError) : null,
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    if (error) {
      setPending(false);
      setError(authErrorMessage(error));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      {googleEnabled ? (
        <>
          <GoogleButton
            label="Entrar con Google"
            errorCallbackURL="/iniciar-sesion"
            onError={setError}
          />
          <OrDivider />
        </>
      ) : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <TextField label="Correo" name="email" type="email" autoComplete="email" required />
        <div className="flex flex-col gap-1">
          <PasswordField
            label="Contraseña"
            name="password"
            autoComplete="current-password"
            required
          />
          <ForgotPasswordHint />
        </div>
        <FormAlert message={error} />
        <Button type="submit" pending={pending} className="w-full">
          {pending ? "Entrando…" : "Iniciar sesión"}
        </Button>
      </form>
    </>
  );
}
