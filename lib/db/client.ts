import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/drizzle/schema";

/**
 * Cliente Drizzle ORM configurado para Neon PostgreSQL serverless.
 * Usa a variável de ambiente DATABASE_URL para conexão.
 * Inicialização lazy para evitar erro durante build quando DATABASE_URL não está disponível.
 */
function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Ensure it is configured in your environment variables."
    );
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

type DbClient = ReturnType<typeof createDb>;

let _db: DbClient | null = null;

function getDb(): DbClient {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export const db = new Proxy({} as DbClient, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
