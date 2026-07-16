"use server";

import { revalidatePath } from "next/cache";
import {
  saveWeekPlanSchema,
  bumpTaskSchema,
} from "@/lib/validation/weekPlan.schema";
import {
  upsertWeekPlan,
  syncWeekPlanTasks,
  bumpWeekPlanTask,
  getWeekPlanTaskOwner,
} from "@/lib/db/queries/weekPlans";
import { getCurrentUserId } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Salva o plano semanal do usuário autenticado (upsert completo).
 *
 * 1. Valida o payload com saveWeekPlanSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Cria ou retorna o WeekPlan existente para (userId, weekStart)
 * 4. Sincroniza as tarefas do plano (delete-all + insert-batch)
 * 5. Invalida o cache da rota principal
 * 6. Retorna resultado estruturado
 */
export async function saveWeekPlan(input: unknown): Promise<ActionResult> {
  const parsed = saveWeekPlanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const weekPlan = await upsertWeekPlan(userId, parsed.data.weekStart);
  await syncWeekPlanTasks(weekPlan.id, parsed.data.tasks);

  revalidatePath("/");

  return { success: true };
}

/**
 * Incrementa o contador `done` de uma tarefa do plano semanal (bump manual).
 *
 * 1. Valida o payload com bumpTaskSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica ownership via getWeekPlanTaskOwner
 * 4. Se não autorizado, retorna erro
 * 5. Incrementa done em 1
 * 6. Invalida o cache da rota principal
 * 7. Retorna resultado estruturado
 */
export async function bumpTask(input: unknown): Promise<ActionResult> {
  const parsed = bumpTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const owner = await getWeekPlanTaskOwner(parsed.data.weekPlanTaskId);

  if (owner?.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  await bumpWeekPlanTask(parsed.data.weekPlanTaskId);

  revalidatePath("/");

  return { success: true };
}
