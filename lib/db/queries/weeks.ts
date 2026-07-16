import { addDays, format } from 'date-fns';
import { sql } from '@/lib/db';
import type { DayStatus, MoodValue } from '@/lib/types/calendar';

/** Conjunto de valores de mood válidos — moods desconhecidos são mapeados para null */
const VALID_MOODS = new Set<string>(['great', 'good', 'neutral', 'bad', 'awful']);

/**
 * Busca o status de 7 dias de uma semana para um usuário.
 *
 * Usa `generate_series` para garantir retorno de exatamente 7 linhas,
 * mesmo para dias sem nenhum registro no banco.
 *
 * @param userId - ID do usuário autenticado
 * @param weekStart - Segunda-feira 00:00 UTC da semana desejada
 * @returns Array de 7 DayStatus ordenados seg→dom
 */
export async function getWeekStatus(
  userId: string,
  weekStart: Date,
): Promise<DayStatus[]> {
  const weekEnd = addDays(weekStart, 6);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const rows = await sql`
    SELECT
      gs.date::date AS date,
      d.mood AS mood,
      COUNT(l.id)::int AS log_count
    FROM
      generate_series(${weekStartStr}::date, ${weekEndStr}::date, '1 day'::interval) AS gs(date)
    LEFT JOIN days d
      ON d.date = gs.date AND d.user_id = ${userId}
    LEFT JOIN logs l
      ON l.day_date = gs.date AND l.user_id = ${userId}
    GROUP BY gs.date, d.mood
    ORDER BY gs.date
  `;

  return rows.map((row) => ({
    date: new Date(row.date),
    logCount: row.log_count ?? 0,
    mood: VALID_MOODS.has(row.mood) ? (row.mood as MoodValue) : null,
  }));
}
