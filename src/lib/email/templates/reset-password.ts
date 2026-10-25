import { renderLayout, type EmailContent } from "./layout";

export function resetPasswordTemplate(name: string, url: string): EmailContent {
  return {
    subject: "Nueva contraseña para Libreta",
    ...renderLayout({
      heading: `Hola, ${name}`,
      paragraphs: [
        "Alguien (esperamos que tú) ha pedido cambiar la contraseña de tu cuenta.",
        "El enlace sirve una sola vez y caduca en una hora.",
      ],
      action: { label: "Elegir una nueva contraseña", url },
      footnote: "Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambiará.",
    }),
  };
}
