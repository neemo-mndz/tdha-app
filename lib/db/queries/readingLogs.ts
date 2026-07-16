import { eq, and, gte, lt, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookReadingLogs } from "@/drizzle/schema";

/**
 * Retorna as datas (yyyy-MM-dd) com registro de leitura para um livro
 * dentro de uma semana (7 dias a partir de weekStart, inclusive do weekStart,
 * exclusive de weekStart + 7).
 */
export async function getWeekReadingDays(
  bookId: string,
  weekStart: string
): Promise<string[]> {
  const weekEnd = getDatePlusDays(weekStart, 7);

  const rows = await db
    .select({ date: bookReadingLogs.date })
    .from(bookReadingLogs)
    .where(
      and(
        eq(bookReadingLogs.bookId, bookId),
        gte(bookReadingLogs.date, weekStart),
        lt(bookReadingLogs.date, weekEnd)
      )
    );

  return rows.map((r) => r.date);
}

/**
 * Verifica se existe um registro de leitura para o livro na data especificada.
 */
export async function hasReadingLog(
  bookId: string,
  date: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: bookReadingLogs.id })
    .from(bookReadingLogs)
    .where(
      and(eq(bookReadingLogs.bookId, bookId), eq(bookReadingLogs.date, date))
    )
    .limit(1);

  return !!row;
}

/**
 * Insere um registro de leitura para o livro na data especificada.
 * Usa onConflictDoNothing() para lidar graciosamente com a unique constraint
 * em (bookId, date), evitando duplicatas.
 */
export async function insertReadingLog(
  bookId: string,
  date: string
): Promise<void> {
  await db
    .insert(bookReadingLogs)
    .values({ bookId, date })
    .onConflictDoNothing();
}

/**
 * Remove o registro de leitura para o livro na data especificada.
 */
export async function deleteReadingLog(
  bookId: string,
  date: string
): Promise<void> {
  await db
    .delete(bookReadingLogs)
    .where(
      and(eq(bookReadingLogs.bookId, bookId), eq(bookReadingLogs.date, date))
    );
}

/**
 * Retorna o total de registros de leitura para um livro.
 */
export async function countReadingLogs(bookId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(bookReadingLogs)
    .where(eq(bookReadingLogs.bookId, bookId));

  return row?.total ?? 0;
}

/**
 * Helper: calcula a data yyyy-MM-dd somando N dias a uma data base.
 */
function getDatePlusDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
