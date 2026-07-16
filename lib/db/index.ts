import { neon } from '@neondatabase/serverless';

/**
 * Cliente SQL do Neon Serverless.
 * Usa a variável de ambiente DATABASE_URL para conexão.
 * Cada chamada executa uma query via HTTP (stateless, edge-compatible).
 */
export function getSQL() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(url);
}
