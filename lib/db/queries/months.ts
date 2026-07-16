import { format } from 'date-fns';
import { eq, and, sql, count } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { days, logs } from '@/drizzle/schema';
import type { DayStatus } from '@/lib/types/calendar';

/**
 * Busca o status de todos os dias de um mês para um usuário.
 * Retorna N items (1→último dia), com logCount = 0 para dias sem logs.
 *
 * @param userId - ID do usuário autenticado
 * @param year - Ano (ex: 2025)
 * @param month - Mês 1-indexado (1=janeiro, 12=dezembro)
 */
export async function getMonthStatus(
  userId: string,
  year: number,
  month: number,
): Promise<DayStatus[]> {
  // Generate all dates for the given month
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed, so (year, month, 0) gives last day of that month
  const monthDates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = format(new Date(year, month - 1, d), 'yyyy-MM-dd');
    monthDates.push(dateStr);
  }

  const firstDate = monthDates[0];
  const lastDate = monthDates[monthDates.length - 1];

  // Uma única query: busca dias + contagem de logs via LEFT JOIN + GROUP BY
  const results = await db
    .select({
      date: days.date,
      logCount: count(logs.id),
    })
    .from(days)
    .leftJoin(logs, eq(logs.dayId, days.id))
    .where(and(
      eq(days.userId, userId),
      sql`${days.date} >= ${firstDate} AND ${days.date} <= ${lastDate}`
    ))
    .groupBy(days.date);

  // Mapear resultados para lookup rápido
  const logCounts: Record<string, number> = {};
  for (const r of results) {
    logCounts[r.date] = r.logCount;
  }

  // Build the full month result
  return monthDates.map((dateStr) => ({
    date: new Date(dateStr + 'T00:00:00'),
    logCount: logCounts[dateStr] ?? 0,
    mood: null,
  }));
}
