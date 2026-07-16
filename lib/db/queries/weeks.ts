import { addDays, format } from 'date-fns';
import { eq, and, asc, sql, count } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { days, logs } from '@/drizzle/schema';
import type { DayStatus } from '@/lib/types/calendar';

/**
 * Busca o status de 7 dias de uma semana para um usuário.
 * Retorna exatamente 7 items (seg→dom), com logCount = 0 para dias sem logs.
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

  // Query only the days that exist in the database for this user
  const existingDays = await db
    .select({
      date: days.date,
      dayId: days.id,
    })
    .from(days)
    .where(and(
      eq(days.userId, userId),
      sql`${days.date} >= ${weekDates[0]} AND ${days.date} <= ${weekDates[6]}`
    ));

  // For each existing day, count logs
  const logCounts: Record<string, number> = {};
  if (existingDays.length > 0) {
    for (const day of existingDays) {
      const [result] = await db
        .select({ count: count() })
        .from(logs)
        .where(eq(logs.dayId, day.dayId));
      logCounts[day.date] = result?.count ?? 0;
    }
  }

  // Build the full 7-day result
  return weekDates.map((dateStr) => ({
    date: new Date(dateStr + 'T00:00:00'),
    logCount: logCounts[dateStr] ?? 0,
    mood: null,
  }));
}
