// Better Auth error codes (and our own from signup-gate) → interface text.
const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "El correo o la contraseña no son correctos.",
  INVALID_EMAIL: "Ese correo no parece válido.",
  USER_ALREADY_EXISTS: "Ya hay una cuenta con ese correo. Prueba a iniciar sesión.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya hay una cuenta con ese correo. Prueba a iniciar sesión.",
  PASSWORD_TOO_SHORT: "La contraseña necesita al menos 8 caracteres.",
  PASSWORD_TOO_LONG: "Esa contraseña es demasiado larga.",
  BANNED_USER: "Tu cuenta está bloqueada. Habla con el administrador.",
  banned: "Tu cuenta está bloqueada. Habla con el administrador.",
  invite_required: "Necesitas un enlace de invitación válido para crear una cuenta.",
  use_password: "Esta cuenta se creó con contraseña. Entra con tu correo y contraseña.",
  account_not_linked: "Esta cuenta se creó con contraseña. Entra con tu correo y contraseña.",
  TOO_MANY_REQUESTS: "Demasiados intentos. Espera un momento y vuelve a probar.",
};

const fallback = "Algo ha fallado. Vuelve a intentarlo.";

export function authErrorMessage(error: { code?: string; status?: number } | string | null) {
  if (!error) return fallback;
  if (typeof error === "string") return messages[error] ?? fallback;
  if (error.status === 429) return messages.TOO_MANY_REQUESTS;
  return (error.code && messages[error.code]) || fallback;
}
