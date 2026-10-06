import { db } from "@/lib/db";
import { days } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Cria ou retorna o dia existente para (userId, date)
 */
export async function upsertDay(userId: string, date: string) {
  // Verificar se o dia já existe
  const existingDay = await db.query.days.findFirst({
    where: eq(days.userId, userId),
    columns: { id: true },
  });

  if (existingDay) {
    return existingDay;
  }

  // Criar novo dia
  const [newDay] = await db
    .insert(days)
    .values({
      userId,
      date,
    })
    .returning();

  return newDay;
}

/**
 * Busca o insight de um dia específico
 */
export async function getDayInsight(userId: string, date: string) {
  const day = await db.query.days.findFirst({
    where: eq(days.userId, userId),
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