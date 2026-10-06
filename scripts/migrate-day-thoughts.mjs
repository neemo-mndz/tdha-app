import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(new URL("../drizzle/migrations/0005_day_thoughts.sql", import.meta.url), "utf8");
await sql.transaction(migration.split(";").map((s) => s.trim()).filter(Boolean).map((s) => sql.query(s)));
console.log("Tabela Sobre o dia criada e índice verificado.");
