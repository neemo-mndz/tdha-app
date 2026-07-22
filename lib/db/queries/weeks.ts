import { addDays, format } from 'date-fns';
import { eq, and, sql, count } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { days, logs } from '@/drizzle/schema';
import type { DayStatus } from '@/lib/types/calendar';

/**
 * Busca o status de 7 dias de uma semana para um usuário.
 * Retorna exatamente 7 items (seg→dom), com logCount = 0 para dias sem logs.
 *
 * Usa uma única query com LEFT JOIN + GROUP BY em vez de N+1 queries.
 */
export async function getWeekStatus(
  userId: string,
  weekStart: Date,
): Promise<DayStatus[]> {
  // Generate all 7 dates of the week
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(format(addDays(weekStart, i), 'yyyy-MM-dd'));
  }

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
      sql`${days.date} >= ${weekDates[0]} AND ${days.date} <= ${weekDates[6]}`
    ))
    .groupBy(days.date);

  // Mapear resultados para lookup rápido
  const logCounts: Record<string, number> = {};
  for (const r of results) {
    logCounts[r.date] = r.logCount;
  }

  // Build the full 7-day result
  // Use noon UTC to avoid timezone shift issues when serialized to client
  return weekDates.map((dateStr) => ({
    date: new Date(dateStr + 'T12:00:00Z'),
    logCount: logCounts[dateStr] ?? 0,
    mood: null,
  }));
}
