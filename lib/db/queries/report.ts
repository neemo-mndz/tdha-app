import { eq, and, asc, inArray, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  days,
  logs,
  weekPlans,
  weekPlanTasks,
  tasks,
  books,
  bookReadingLogs,
} from "@/drizzle/schema";

/**
 * Retorna logs de um usuário para as datas selecionadas,
 * ordenados por createdAt ASC (mais antigo primeiro).
 * Usado na geração do relatório semanal.
 */
export async function getReportLogs(
  userId: string,
  dates: string[]
): Promise<Array<{ date: string; content: string; createdAt: Date }>> {
  if (dates.length === 0) return [];

  const rows = await db
    .select({
      date: days.date,
      content: logs.content,
      createdAt: logs.createdAt,
    })
    .from(logs)
    .innerJoin(days, eq(logs.dayId, days.id))
    .where(and(eq(days.userId, userId), inArray(days.date, dates)))
    .orderBy(asc(logs.createdAt));

  return rows;
}

/**
 * Retorna o progresso de tarefas do plano semanal de um usuário.
 * Inclui nome da tarefa, meta (goal) e quantidade concluída (done).
 */
export async function getReportTaskProgress(
  userId: string,
  weekStart: string
): Promise<Array<{ name: string; goal: number; done: number }>> {
  const rows = await db
    .select({
      name: tasks.name,
      goal: weekPlanTasks.goal,
      done: weekPlanTasks.done,
    })
    .from(weekPlanTasks)
    .innerJoin(weekPlans, eq(weekPlanTasks.weekPlanId, weekPlans.id))
    .innerJoin(tasks, eq(weekPlanTasks.taskId, tasks.id))
    .where(and(eq(weekPlans.userId, userId), eq(weekPlans.weekStart, weekStart)));

  return rows;
}

/**
 * Retorna a atividade de leitura do usuário para as datas selecionadas.
 * Inclui a data e o título do livro lido.
 */
export async function getReportReadingActivity(
  userId: string,
  dates: string[]
): Promise<Array<{ date: string; bookTitle: string }>> {
  if (dates.length === 0) return [];

  const rows = await db
    .select({
      date: bookReadingLogs.date,
      bookTitle: books.title,
    })
    .from(bookReadingLogs)
    .innerJoin(books, eq(bookReadingLogs.bookId, books.id))
    .where(and(eq(books.userId, userId), inArray(bookReadingLogs.date, dates)));

  return rows;
}

/**
 * Retorna as datas (yyyy-MM-dd) que possuem pelo menos 1 log
 * dentro de uma semana (7 dias a partir de weekStart).
 * Usado para pré-selecionar dias no DaySelector.
 */
export async function getDaysWithLogs(
  userId: string,
  weekStart: string
): Promise<string[]> {
  const weekEnd = getDatePlusDays(weekStart, 7);

  const rows = await db
    .selectDistinct({ date: days.date })
    .from(days)
    .innerJoin(logs, eq(logs.dayId, days.id))
    .where(
      and(
        eq(days.userId, userId),
        gte(days.date, weekStart),
        lt(days.date, weekEnd)
      )
    );

  return rows.map((r) => r.date);
}

/**
 * Helper: calcula a data yyyy-MM-dd somando N dias a uma data base.
 */
function getDatePlusDays(dateStr: string, numDays: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + numDays);
  return d.toISOString().slice(0, 10);
}
