import { renderLayout, type EmailContent } from "./layout";

export function verifyEmailTemplate(name: string, url: string): EmailContent {
  return {
    subject: "Confirma tu correo en Libreta",
    ...renderLayout({
      heading: `Hola, ${name}`,
      paragraphs: [
        "Ya casi está. Confirma tu correo y tu libreta quedará lista para empezar a escribir.",
      ],
      action: { label: "Confirmar mi correo", url },
      footnote: "Si no has creado una cuenta en Libreta, ignora este mensaje.",
    }),
  };
}
