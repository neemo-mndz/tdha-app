"use server";

import { revalidatePath } from "next/cache";
import {
  createReminderSchema,
  toggleReminderSchema,
  deleteReminderSchema,
} from "@/lib/validation/reminder.schema";
import {
  insertReminder,
  getReminderById,
  countActiveReminders,
  updateReminderActive,
  deleteReminderById,
} from "@/lib/db/queries/reminders";
import { getCurrentUserId } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Cria um novo lembrete para o usuário autenticado.
 *
 * 1. Valida o payload com createReminderSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica se o limite de 20 lembretes ativos foi atingido
 * 4. Insere o lembrete no banco
 * 5. Invalida o cache da rota /settings/reminders
 * 6. Retorna resultado estruturado
 */
export async function createReminder(input: unknown): Promise<ActionResult> {
  const parsed = createReminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  const activeCount = await countActiveReminders(userId);
  if (activeCount >= 20) {
    return { success: false, error: "Limite de 20 lembretes atingido." };
  }

  await insertReminder({
    userId,
    hour: parsed.data.hour,
    minute: parsed.data.minute,
    active: true,
  });

  revalidatePath("/settings/reminders");

  return { success: true };
}

/**
 * Ativa ou desativa um lembrete existente do usuário autenticado.
 *
 * 1. Valida o payload com toggleReminderSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Busca o lembrete e verifica autorização
 * 4. Se reativando, verifica o limite de 20 ativos
 * 5. Alterna o campo active
 * 6. Invalida o cache da rota /settings/reminders
 * 7. Retorna resultado estruturado
 */
export async function toggleReminder(input: unknown): Promise<ActionResult> {
  const parsed = toggleReminderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const userId = await getCurrentUserId();
  const reminder = await getReminderById(parsed.data.reminderId);

  if (!reminder || reminder.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  // If reactivating, check limit
  if (!reminder.active) {
    const activeCount = await countActiveReminders(userId);
    if (activeCount >= 20) {
      return { success: false, error: "Limite de 20 lembretes atingido." };
    }
  }

  await updateReminderActive(parsed.data.reminderId, !reminder.active);

  revalidatePath("/settings/reminders");

  return { success: true };
}

/**
 * Remove permanentemente um lembrete do usuário autenticado.
 *
 * 1. Valida o payload com deleteReminderSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Busca o lembrete e verifica autorização
 * 4. Remove o lembrete do banco
 * 5. Invalida o cache da rota /settings/reminders
 * 6. Retorna resultado estruturado
 */
export async function deleteReminder(input: unknown): Promise<ActionResult> {
  const parsed = deleteReminderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const userId = await getCurrentUserId();
  const reminder = await getReminderById(parsed.data.reminderId);

  if (!reminder || reminder.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  await deleteReminderById(parsed.data.reminderId);

  revalidatePath("/settings/reminders");

  return { success: true };
}
