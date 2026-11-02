"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/error-messages";
import { FormAlert } from "./FormAlert";
import { GoogleButton } from "./GoogleButton";
import { OrDivider } from "./OrDivider";

const emailSchema = z.email();

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const callbackError = useSearchParams().get("error");
  const [error, setError] = useState<string | null>(
    callbackError ? authErrorMessage(callbackError) : null,
  );
  const [emailError, setEmailError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  function checkEmail(value: string) {
    setEmailError(
      value && !emailSchema.safeParse(value).success ? "Ese correo no parece válido." : undefined,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(data.get("name")).trim(),
      email: String(data.get("email")).trim(),
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
          <GoogleButton label="Continuar con Google" errorCallbackURL="/registro" onError={setError} />
          <OrDivider />
        </>
      ) : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <TextField
          label="Nombre"
          name="name"
          autoComplete="name"
          required
          maxLength={80}
          placeholder="Cómo te verán tus compañeros"
        />
        <TextField
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          error={emailError}
          onChange={(e) => checkEmail(e.currentTarget.value)}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="Mínimo 8 caracteres."
        />
        <FormAlert message={error} />
        <Button type="submit" pending={pending} disabled={Boolean(emailError)} className="w-full">
          {pending ? "Creando tu cuenta…" : "Crear cuenta"}
        </Button>
      </form>
    </>
  );
}
