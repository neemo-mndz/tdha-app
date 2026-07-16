import { neon } from '@neondatabase/serverless';

/**
 * Cliente SQL do Neon Serverless.
 * Usa a variável de ambiente DATABASE_URL para conexão.
 * Cada chamada executa uma query via HTTP (stateless, edge-compatible).
 */
export const sql = neon(process.env.DATABASE_URL!);
