import { eq, and, asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { days, logs, weekPlanTasks, tasks, logTags, tags } from "@/drizzle/schema";
import type { Log, Day } from "@/drizzle/schema";

export type LogWithTask = Log & {
  taskName: string | null;
  tags: { id: string; name: string }[];
};

/**
 * Retorna todos os logs de um dia específico para um usuário,
 * em ordem cronológica crescente de criação.
 * Inclui o nome da tarefa vinculada (via weekPlanTasks → tasks) quando presente,
 * e as tags associadas a cada log.
 */
export async function getDayLogs(userId: string, date: string): Promise<LogWithTask[]> {
  const result = await db
    .select({ log: logs, taskName: tasks.name })
    .from(logs)
    .innerJoin(days, eq(logs.dayId, days.id))
    .leftJoin(weekPlanTasks, eq(logs.weekPlanTaskId, weekPlanTasks.id))
    .leftJoin(tasks, eq(weekPlanTasks.taskId, tasks.id))
    .where(and(eq(days.userId, userId), eq(days.date, date)))
    .orderBy(asc(logs.createdAt));

  const logIds = result.map((r) => r.log.id);

  // Fetch tags for all logs in a single query
  const tagRows =
    logIds.length > 0
      ? await db
          .select({
            logId: logTags.logId,
            tagId: tags.id,
            tagName: tags.name,
          })
          .from(logTags)
          .innerJoin(tags, eq(logTags.tagId, tags.id))
          .where(inArray(logTags.logId, logIds))
      : [];

  // Group tags by logId
  const tagsByLogId = new Map<string, { id: string; name: string }[]>();
  for (const row of tagRows) {
    const list = tagsByLogId.get(row.logId) ?? [];
    list.push({ id: row.tagId, name: row.tagName });
    tagsByLogId.set(row.logId, list);
  }

  return result.map((r) => ({
    ...r.log,
    taskName: r.taskName,
    tags: tagsByLogId.get(r.log.id) ?? [],
  }));
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

export async function insertLog(input: {
  dayId: string;
  content: string;
  weekPlanTaskId?: string | null;
}): Promise<Log> {
  const [log] = await db.insert(logs).values(input).returning();
  return log;
}

export async function updateLogById(logId: string, content: string, newDayId?: string): Promise<void> {
  const values: { content: string; dayId?: string } = { content };
  if (newDayId) {
    values.dayId = newDayId;
  }
  await db.update(logs).set(values).where(eq(logs.id, logId));
}

export async function updateLogCreatedAt(logId: string, newCreatedAt: Date): Promise<void> {
  await db.update(logs).set({ createdAt: newCreatedAt }).where(eq(logs.id, logId));
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

/**
 * Retorna o weekPlanTaskId de um log pelo seu id.
 * Usado para decrementar o contador da tarefa ao excluir um log vinculado.
 */
export async function getLogWeekPlanTaskId(
  logId: string
): Promise<string | null> {
  const [result] = await db
    .select({ weekPlanTaskId: logs.weekPlanTaskId })
    .from(logs)
    .where(eq(logs.id, logId))
    .limit(1);
  return result?.weekPlanTaskId ?? null;
}
