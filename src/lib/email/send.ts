import { Resend } from "resend";
import { env } from "@/lib/env";
import type { EmailContent } from "./templates/layout";

let client: Resend | undefined;

export async function sendEmail(to: string, content: EmailContent): Promise<void> {
  client ??= new Resend(env().RESEND_API_KEY);
  const { error } = await client.emails.send({
    from: env().EMAIL_FROM,
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
  if (error) {
    // Logged without the recipient so personal data doesn't end up in logs.
    console.error("[email] send failed:", error.name, error.message);
    throw new Error("No se pudo enviar el correo");
  }
}
