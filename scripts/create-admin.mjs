// Creates the superadmin account, or turns an existing account into the
// superadmin and sets a new password. Since sign-up is invite-only, this is
// how the first account exists, and how the superadmin gets back in if they
// forget their own password.
//
// Usage: npm run admin:create

import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Writable } from "node:stream";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

const SUPERADMIN_ROLE = "superadmin"; // keep in sync with src/lib/auth/admin-permissions.ts
const MIN_PASSWORD = 8;

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Output goes through a stream that can be muted, so passwords aren't echoed.
let muted = false;
const output = new Writable({
  write(chunk, _encoding, done) {
    if (!muted) stdout.write(chunk);
    done();
  },
});
const rl = createInterface({ input: stdin, output, terminal: Boolean(stdin.isTTY) });

async function askHidden(question) {
  stdout.write(question);
  muted = true;
  try {
    return await rl.question("");
  } finally {
    muted = false;
    stdout.write("\n");
  }
}

function newId() {
  return randomBytes(24).toString("base64url");
}

try {
  const email = (await rl.question("Correo: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Ese correo no parece válido.");

  const [existing] = await sql`select id, name from "user" where email = ${email}`;
  const name = existing ? existing.name : (await rl.question("Nombre: ")).trim();
  if (!name) throw new Error("El nombre no puede estar vacío.");

  const password = await askHidden("Contraseña (mínimo 8 caracteres): ");
  if (password.length < MIN_PASSWORD) throw new Error("La contraseña es demasiado corta.");
  if (password !== (await askHidden("Repite la contraseña: "))) {
    throw new Error("Las contraseñas no coinciden.");
  }

  const hash = await hashPassword(password);
  const userId = existing?.id ?? newId();

  await sql.transaction([
    sql`insert into "user" (id, name, email, email_verified, role, banned)
        values (${userId}, ${name}, ${email}, true, ${SUPERADMIN_ROLE}, false)
        on conflict (id) do update set role = ${SUPERADMIN_ROLE}, banned = false, updated_at = now()`,
    sql`update account set password = ${hash}, updated_at = now()
        where user_id = ${userId} and provider_id = 'credential'`,
    sql`insert into account (id, account_id, provider_id, user_id, password, updated_at)
        select ${newId()}, ${userId}, 'credential', ${userId}, ${hash}, now()
        where not exists (
          select 1 from account where user_id = ${userId} and provider_id = 'credential'
        )`,
    sql`delete from session where user_id = ${userId}`,
  ]);

  console.log(
    existing
      ? `Listo: ${email} es superadmin y tiene contraseña nueva.`
      : `Listo: cuenta de superadmin creada para ${email}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
}
