import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { days, logs } from "@/drizzle/schema";
import type { Log, Day } from "@/drizzle/schema";

/**
 * Retorna todos os logs de um dia específico para um usuário,
 * em ordem cronológica crescente de criação.
 */
export async function getDayLogs(userId: string, date: string): Promise<Log[]> {
  const result = await db
    .select({ log: logs })
    .from(logs)
    .innerJoin(days, eq(logs.dayId, days.id))
    .where(and(eq(days.userId, userId), eq(days.date, date)))
    .orderBy(asc(logs.createdAt));

  return result.map((r) => r.log);
}

/**
 * Cria ou retorna o Day existente para a combinação userId + date.
 * Usa INSERT ... ON CONFLICT DO NOTHING seguido de SELECT para garantir
 * atomicidade sem race condition em ambiente serverless.
 */
export async function upsertDay(userId: string, date: string): Promise<Day> {
  await db
    .insert(days)
    .values({ userId, date })
    .onConflictDoNothing();

  const [day] = await db
    .select()
    .from(days)
    .where(and(eq(days.userId, userId), eq(days.date, date)))
    .limit(1);

  return day;
}

export async function insertLog(input: { dayId: string; content: string }): Promise<Log> {
  const [log] = await db.insert(logs).values(input).returning();
  return log;
}

export async function updateLogById(logId: string, content: string): Promise<void> {
  await db.update(logs).set({ content }).where(eq(logs.id, logId));
}

export async function deleteLogById(logId: string): Promise<void> {
  await db.delete(logs).where(eq(logs.id, logId));
}

/**
 * Retorna o userId do dono de um log via join days → userId.
 * Usado para verificação de autorização nas Server Actions.
 */
export async function getLogOwner(
  logId: string
): Promise<{ userId: string } | undefined> {
  const [result] = await db
    .select({ userId: days.userId })
    .from(logs)
    .innerJoin(days, eq(logs.dayId, days.id))
    .where(eq(logs.id, logId))
    .limit(1);
  return result;
}
