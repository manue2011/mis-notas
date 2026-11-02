"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/error-messages";
import { FormAlert } from "./FormAlert";
import { ForgotPasswordButton, ForgotPasswordNote } from "./ForgotPasswordHint";
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
  const [forgotOpen, setForgotOpen] = useState(false);

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
            label="Continuar con Google"
            errorCallbackURL="/iniciar-sesion"
            onError={setError}
          />
          <OrDivider />
        </>
      ) : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <TextField
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
        />
        <div>
          <PasswordField
            label="Contraseña"
            name="password"
            autoComplete="current-password"
            required
            labelAside={
              <ForgotPasswordButton open={forgotOpen} onToggle={() => setForgotOpen((v) => !v)} />
            }
          />
          <ForgotPasswordNote open={forgotOpen} />
        </div>
        <FormAlert message={error} />
        <Button type="submit" pending={pending} className="w-full">
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </>
  );
}
