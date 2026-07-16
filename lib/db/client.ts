import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/drizzle/schema";

/**
 * Cliente Drizzle ORM configurado para Neon PostgreSQL serverless.
 * Usa a variável de ambiente DATABASE_URL para conexão.
 * Cada operação é executada via HTTP (stateless, edge-compatible).
 */
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
