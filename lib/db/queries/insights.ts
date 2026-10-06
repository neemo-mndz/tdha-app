import { db } from "@/lib/db";
import { days } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { upsertDay as upsertDayByDate } from "@/lib/db/queries/logs";

/**
 * Cria ou retorna o dia existente para (userId, date)
 */
export async function upsertDay(userId: string, date: string) {
  return upsertDayByDate(userId, date);
}

/**
 * Busca o insight de um dia específico
 */
export async function getDayInsight(userId: string, date: string) {
  const day = await db.query.days.findFirst({
    where: and(eq(days.userId, userId), eq(days.date, date)),
    columns: { id: true, insight: true },
  });

  if (!day) {
    return null;
  }

  return day.insight ?? null;
}

/**
 * Atualiza o insight de um dia específico
 */
export async function updateDayInsight(dayId: string, content: string | null) {
  await db
    .update(days)
    .set({ insight: content })
    .where(eq(days.id, dayId));
}
