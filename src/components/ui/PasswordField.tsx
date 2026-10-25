"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField } from "./TextField";

type Props = Omit<ComponentProps<typeof TextField>, "type" | "trailing">;

export function PasswordField(props: Props) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="grid size-11 shrink-0 place-items-center rounded-md text-ink-muted hover:text-ink"
        >
          <Icon size={18} strokeWidth={1.5} aria-hidden />
        </button>
      }
    />
  );
}
