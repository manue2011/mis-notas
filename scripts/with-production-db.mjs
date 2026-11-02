// Runs a command against the production database (Neon "main" branch)
// instead of the local "dev" branch:
//
//   node scripts/with-production-db.mjs drizzle-kit migrate
//
// Reads PRODUCTION_DATABASE_URL(_UNPOOLED) from .env.local and passes them
// to the command as DATABASE_URL(_UNPOOLED).

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { ask } from "./prompt.mjs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.PRODUCTION_DATABASE_URL;
if (!url) {
  console.error("Falta PRODUCTION_DATABASE_URL en .env.local");
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Uso: node scripts/with-production-db.mjs <comando> [argumentos]");
  process.exit(1);
}

const answer = await ask(`Vas a ejecutar "${[command, ...args].join(" ")}" contra PRODUCCIÓN. Escribe "si" para seguir: `);
if (answer.trim().toLowerCase() !== "si") {
  console.log("Cancelado.");
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: url,
    DATABASE_URL_UNPOOLED: process.env.PRODUCTION_DATABASE_URL_UNPOOLED ?? url,
  },
});
process.exit(result.status ?? 1);
