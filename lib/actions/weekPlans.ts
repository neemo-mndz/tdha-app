"use server";

import { revalidatePath } from "next/cache";
import {
  saveWeekPlanSchema,
  bumpTaskSchema,
  toggleTaskDaySchema,
} from "@/lib/validation/weekPlan.schema";
import {
  upsertWeekPlan,
  syncWeekPlanTasks,
  bumpWeekPlanTask,
  getWeekPlanTaskOwner,
  toggleWeekPlanTaskDay,
} from "@/lib/db/queries/weekPlans";
import { getCurrentUserId } from "@/lib/auth";
import { getTaskOwner } from "@/lib/db/queries/tasks";
import { isDateInWeek, rhythmToday } from "@/lib/utils/taskRhythm";
import { parseISO } from "date-fns";

function revalidateRhythm() {
  revalidatePath("/");
  revalidatePath("/week/[weekStart]", "page");
}

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Salva o plano semanal do usuário autenticado (upsert completo).
 *
 * 1. Valida o payload com saveWeekPlanSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Cria ou retorna o WeekPlan existente para (userId, weekStart)
 * 4. Sincroniza tarefas preservando IDs e progresso das mantidas
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
  if (parseISO(parsed.data.weekStart).getDay() !== 1) {
    return { success: false, error: "A semana deve começar em uma segunda-feira" };
  }
  const owners = await Promise.all(parsed.data.tasks.map((task) => getTaskOwner(task.taskId)));
  if (owners.some((owner) => owner?.userId !== userId)) {
    return { success: false, error: "Tarefa inválida para este usuário" };
  }
  const weekPlan = await upsertWeekPlan(userId, parsed.data.weekStart);
  await syncWeekPlanTasks(weekPlan.id, parsed.data.tasks);

  revalidateRhythm();

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

  const date = parsed.data.todayDate;
  if (date && (!isDateInWeek(date, owner.weekStart) || date > rhythmToday())) {
    return { success: false, error: "Escolha um dia desta semana até hoje" };
  }
  if (owner.weekStart > rhythmToday()) {
    return { success: false, error: "Esta semana ainda não começou" };
  }
  await bumpWeekPlanTask(parsed.data.weekPlanTaskId, date);

  revalidateRhythm();

  return { success: true };
}

export async function toggleTaskDay(input: unknown): Promise<ActionResult> {
  const parsed = toggleTaskDaySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const userId = await getCurrentUserId();
  const owner = await getWeekPlanTaskOwner(parsed.data.weekPlanTaskId);
  if (owner?.userId !== userId) return { success: false, error: "Não autorizado" };
  if (!isDateInWeek(parsed.data.date, owner.weekStart) || parsed.data.date > rhythmToday()) {
    return { success: false, error: "Escolha um dia desta semana até hoje" };
  }
  await toggleWeekPlanTaskDay(parsed.data.weekPlanTaskId, parsed.data.date);
  revalidateRhythm();
  return { success: true };
}
