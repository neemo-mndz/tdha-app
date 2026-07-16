import { eq, gte, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { loginAttempts } from "@/drizzle/schema";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number; // presente quando blocked
}

/**
 * Normaliza o email para comparação consistente:
 * lowercase + trim.
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Verifica se o email está dentro do limite de tentativas de login.
 * Conta tentativas falhas nos últimos 15 minutos.
 * Se >= 5, retorna allowed: false com retryAfterSeconds calculado
 * a partir da tentativa mais antiga na janela.
 */
export async function checkRateLimit(email: string): Promise<RateLimitResult> {
  const normalized = normalizeEmail(email);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const attempts = await db
    .select({ attemptedAt: loginAttempts.attemptedAt })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, normalized),
        gte(loginAttempts.attemptedAt, windowStart)
      )
    );

  if (attempts.length >= MAX_ATTEMPTS) {
    // Encontra a tentativa mais antiga na janela para calcular quando o bloqueio expira
    const oldest = attempts.reduce((min, a) =>
      a.attemptedAt < min ? a.attemptedAt : min,
      attempts[0].attemptedAt
    );

    const windowEnd = oldest.getTime() + RATE_LIMIT_WINDOW_MS;
    const retryAfterSeconds = Math.ceil((windowEnd - Date.now()) / 1000);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  return { allowed: true };
}

/**
 * Registra uma tentativa de login falha para o email informado.
 */
export async function recordFailedAttempt(email: string): Promise<void> {
  const normalized = normalizeEmail(email);

  await db.insert(loginAttempts).values({
    email: normalized,
  });
}

/**
 * Remove todos os registros de tentativas falhas para o email informado.
 * Chamado após login bem-sucedido.
 */
export async function clearFailedAttempts(email: string): Promise<void> {
  const normalized = normalizeEmail(email);

  await db.delete(loginAttempts).where(eq(loginAttempts.email, normalized));
}
