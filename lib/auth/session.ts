import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions } from "@/drizzle/schema";

/**
 * Interface pública de sessão retornada por validateSession.
 */
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

/** 30 dias em milissegundos */
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Cria uma nova sessão para o usuário.
 * Gera um token de 64 caracteres hex (256 bits de entropia).
 * Retorna o sessionId (token) ou null em caso de erro de DB.
 */
export async function createSession(userId: string): Promise<string | null> {
  try {
    const sessionId = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt,
    });

    return sessionId;
  } catch (error) {
    console.error("Failed to create session:", error);
    return null;
  }
}

/**
 * Valida uma sessão existente.
 * Retorna os dados da sessão se válida e não expirada, ou null caso contrário.
 */
export async function validateSession(sessionId: string): Promise<Session | null> {
  try {
    const result = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      userId: row.userId,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  } catch (error) {
    console.error("Failed to validate session:", error);
    return null;
  }
}

/**
 * Renova a sessão, estendendo a expiração para 30 dias a partir de agora.
 */
export async function renewSession(sessionId: string): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db
      .update(sessions)
      .set({ expiresAt })
      .where(eq(sessions.id, sessionId));
  } catch (error) {
    console.error("Failed to renew session:", error);
  }
}

/**
 * Invalida (deleta) uma sessão do banco de dados.
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  } catch (error) {
    console.error("Failed to invalidate session:", error);
  }
}
