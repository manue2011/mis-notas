import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

// WebSocket pool (not neon-http) so that interactive transactions work.
const pool = new Pool({ connectionString: env().DATABASE_URL });

export const db = drizzle({ client: pool, schema });

export type Db = typeof db;
