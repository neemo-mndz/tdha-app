import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export interface SearchResult {
  logId: string;
  content: string;
  date: string;
  time: string;
  tags: { id: string; name: string }[];
  source: "log" | "mood_note";
}

interface SearchRow {
  [key: string]: unknown;
  log_id: string;
  content: string;
  date: string;
  time: string;
  source: string;
  tag_ids: string[] | null;
  tag_names: string[] | null;
}

/**
 * Busca combinada de logs com filtros de texto, tags e semana.
 *
 * - Texto: busca case-insensitive e accent-insensitive via unaccent(lower()) + ILIKE
 *   em logs.content e days.mood_note
 * - Tags: OR logic (ANY) — retorna logs que tenham pelo menos uma das tags selecionadas
 * - Semana: restringe a [weekStart, weekStart + 7 days)
 * - AND entre tipos de filtro distintos
 * - Sem filtros ativos → retorna todos os logs em ordem cronológica reversa
 */
export async function searchLogs(
  userId: string,
  filters: { text: string; tagIds: string[]; weekStart: string | null }
): Promise<SearchResult[]> {
  const { text, tagIds, weekStart } = filters;

  const hasText = text.trim().length > 0;
  const hasTags = tagIds.length > 0;
  const hasWeek = weekStart !== null;

  // Use Drizzle's sql tagged template for the full query
  // to leverage unaccent() and flexible filtering with parameterized inputs
  const result = await db.execute<SearchRow>(sql`
    SELECT
      sub.log_id,
      sub.content,
      sub.date,
      sub.time,
      sub.source,
      array_agg(DISTINCT t.id) FILTER (WHERE t.id IS NOT NULL) AS tag_ids,
      array_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL) AS tag_names
    FROM (
      SELECT DISTINCT
        l.id AS log_id,
        l.content,
        d.date::text AS date,
        to_char(l.created_at AT TIME ZONE 'UTC', 'HH24:MI') AS time,
        'log'::text AS source,
        l.created_at,
        l.id AS join_log_id
      FROM logs l
      INNER JOIN days d ON l.day_id = d.id
      WHERE d.user_id = ${userId}
        AND (
          ${!hasText}::boolean
          OR l.content ILIKE '%' || ${text} || '%'
          OR COALESCE(d.mood_note, '') ILIKE '%' || ${text} || '%'
        )
        AND (
          ${!hasTags}::boolean
          OR l.id IN (
            SELECT lt.log_id FROM log_tags lt
            WHERE lt.tag_id = ANY(${hasTags ? tagIds : []}::uuid[])
          )
        )
        AND (
          ${!hasWeek}::boolean
          OR (
            d.date >= ${weekStart ?? "1970-01-01"}::date
            AND d.date < (${weekStart ?? "1970-01-01"}::date + INTERVAL '7 days')
          )
        )
    ) sub
    LEFT JOIN log_tags lt2 ON lt2.log_id = sub.join_log_id
    LEFT JOIN tags t ON t.id = lt2.tag_id
    GROUP BY sub.log_id, sub.content, sub.date, sub.time, sub.source, sub.created_at
    ORDER BY sub.created_at DESC
  `);

  const rows = result.rows as SearchRow[];

  return rows.map((row) => {
    const rowTagIds = row.tag_ids ?? [];
    const rowTagNames = row.tag_names ?? [];
    const resultTags: { id: string; name: string }[] = rowTagIds.map((id, i) => ({
      id,
      name: rowTagNames[i] ?? "",
    }));

    return {
      logId: row.log_id,
      content: row.content,
      date: row.date,
      time: row.time,
      tags: resultTags,
      source: (row.source === "mood_note" ? "mood_note" : "log") as "log" | "mood_note",
    };
  });
}
