import { eq, asc, and, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reminders } from "@/drizzle/schema";
import type { Reminder } from "@/drizzle/schema";

/**
 * Retorna todos os lembretes de um usuário,
 * ordenados por hora e minuto crescentes.
 */
export async function getReminders(userId: string): Promise<Reminder[]> {
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, userId))
    .orderBy(asc(reminders.hour), asc(reminders.minute));
}

/**
 * Retorna um lembrete pelo ID, ou null se não existir.
 */
export async function getReminderById(
  id: string
): Promise<Reminder | null> {
  const [result] = await db
    .select()
    .from(reminders)
    .where(eq(reminders.id, id))
    .limit(1);
  return result ?? null;
}

/**
 * Retorna a quantidade de lembretes ativos de um usuário.
 */
export async function countActiveReminders(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(reminders)
    .where(
      and(eq(reminders.userId, userId), eq(reminders.active, true))
    );
  return result?.count ?? 0;
}

/**
 * Insere um novo lembrete no banco de dados.
 */
export async function insertReminder(input: {
  userId: string;
  hour: number;
  minute: number;
  active: boolean;
}): Promise<Reminder> {
  const [reminder] = await db.insert(reminders).values(input).returning();
  return reminder;
}

/**
 * Atualiza o campo active de um lembrete.
 */
export async function updateReminderActive(
  id: string,
  active: boolean
): Promise<void> {
  await db
    .update(reminders)
    .set({ active })
    .where(eq(reminders.id, id));
}

/**
 * Remove um lembrete pelo ID.
 */
export async function deleteReminderById(id: string): Promise<void> {
  await db.delete(reminders).where(eq(reminders.id, id));
}
