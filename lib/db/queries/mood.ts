import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { days } from "@/drizzle/schema";
import type { MoodValue } from "@/lib/validation/mood.schema";

/**
 * Atualiza o mood de um dia existente.
 * mood pode ser null (clear).
 */
export async function updateDayMood(
  dayId: string,
  mood: MoodValue | null
): Promise<void> {
  await db.update(days).set({ mood }).where(eq(days.id, dayId));
}

/**
 * Atualiza a nota de humor de um dia existente.
 * note pode ser null (clear).
 */
export async function updateDayMoodNote(
  dayId: string,
  note: string | null
): Promise<void> {
  await db.update(days).set({ moodNote: note }).where(eq(days.id, dayId));
}

/**
 * Retorna o mood e moodNote de um dia para um usuário.
 * Normaliza valores inválidos de mood para null na leitura,
 * garantindo que dados corrompidos no DB nunca propaguem para a UI.
 */
export async function getDayMood(
  userId: string,
  date: string
): Promise<{ mood: MoodValue | null; moodNote: string | null }> {
  const [row] = await db
    .select({ mood: days.mood, moodNote: days.moodNote })
    .from(days)
    .where(and(eq(days.userId, userId), eq(days.date, date)))
    .limit(1);

  if (!row) return { mood: null, moodNote: null };

  // Validate mood value at read time — invalid values normalize to null
  const validMoods: string[] = ["great", "good", "neutral", "bad", "awful"];
  const mood = validMoods.includes(row.mood ?? "")
    ? (row.mood as MoodValue)
    : null;

  return { mood, moodNote: row.moodNote };
}
