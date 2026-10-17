import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

// Run with DATABASE_URL configured (or node --env-file=.env.local ...).
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não configurada. Migração não executada.');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
try {
  const migration = await readFile(new URL('../drizzle/migrations/0006_weekly_rhythm.sql', import.meta.url), 'utf8');
  const statements = migration.split('--> statement-breakpoint').map((statement) => statement.trim()).filter(Boolean);
  await sql.transaction(statements.map((statement) => sql.query(statement)));
  console.log('Mapa de ritmo: migração aplicada com sucesso.');
} catch (error) {
  console.error('Falha na migração:', error.message);
  process.exit(1);
}
