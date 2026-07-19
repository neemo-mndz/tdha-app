"use server";

import { revalidatePath } from "next/cache";
import {
  createLogSchema,
  updateLogSchema,
  deleteLogSchema,
  updateLogTimeSchema,
} from "@/lib/validation/log.schema";
import {
  upsertDay,
  insertLog,
  updateLogById,
  updateLogCreatedAt,
  deleteLogById,
  getLogOwner,
  getLogWeekPlanTaskId,
  getDayLogs,
  type LogWithTask,
} from "@/lib/db/queries/logs";
import {
  bumpWeekPlanTask,
  decrementWeekPlanTask,
  getWeekPlanTaskOwner,
} from "@/lib/db/queries/weekPlans";
import { getMonthStatus } from "@/lib/db/queries/months";
import { getCurrentUserId } from "@/lib/auth";
import type { DayStatus } from "@/lib/types/calendar";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Busca os logs de uma data específica para o usuário autenticado.
 * Usado pelo card "Registros do dia" na tela principal, que exibe
 * os registros do dia atualmente selecionado no calendário.
 */
export async function getLogsForDate(date: string): Promise<LogWithTask[]> {
  const userId = await getCurrentUserId();
  return getDayLogs(userId, date);
}

/**
 * Cria um novo log para uma data específica do usuário autenticado.
 *
 * 1. Valida o payload com createLogSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Cria ou retorna o Day existente para (userId, date)
 * 4. Insere o log associado ao Day
 * 5. Invalida o cache da rota do dia
 * 6. Retorna resultado estruturado
 */
export async function createLog(input: unknown): Promise<ActionResult> {
  const parsed = createLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Validar ownership do weekPlanTaskId se presente
  const weekPlanTaskId = parsed.data.weekPlanTaskId ?? null;
  if (weekPlanTaskId) {
    const taskOwner = await getWeekPlanTaskOwner(weekPlanTaskId);
    if (!taskOwner || taskOwner.userId !== userId) {
      return { success: false, error: "Tarefa inválida para esta semana" };
    }
  }

  const day = await upsertDay(userId, parsed.data.date);
  await insertLog({
    dayId: day.id,
    content: parsed.data.content,
    weekPlanTaskId,
  });

  // Incrementar contador da tarefa vinculada
  if (weekPlanTaskId) {
    await bumpWeekPlanTask(weekPlanTaskId);
  }

  revalidatePath(`/day/${parsed.data.date}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * Atualiza o conteúdo de um log existente.
 *
 * 1. Valida o payload com updateLogSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica autorização via getLogOwner
 * 4. Se não autorizado, retorna erro
 * 5. Atualiza o log no banco
 * 6. Invalida o cache da rota do dia
 * 7. Retorna resultado estruturado
 */
export async function updateLog(input: unknown): Promise<ActionResult> {
  const parsed = updateLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const owner = await getLogOwner(parsed.data.logId);

  if (owner?.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  await updateLogById(parsed.data.logId, parsed.data.content);

  revalidatePath(`/day/${parsed.data.date}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * Exclui um log existente.
 *
 * 1. Valida o payload com deleteLogSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica autorização via getLogOwner
 * 4. Se não autorizado, retorna erro
 * 5. Exclui o log do banco
 * 6. Invalida o cache da rota do dia
 * 7. Retorna resultado estruturado
 */
export async function deleteLog(input: unknown): Promise<ActionResult> {
  const parsed = deleteLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const owner = await getLogOwner(parsed.data.logId);

  if (owner?.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  // Buscar weekPlanTaskId antes de excluir o log
  const weekPlanTaskId = await getLogWeekPlanTaskId(parsed.data.logId);

  await deleteLogById(parsed.data.logId);

  // Decrementar contador da tarefa vinculada (floor em 0)
  if (weekPlanTaskId) {
    await decrementWeekPlanTask(weekPlanTaskId);
  }

  revalidatePath(`/day/${parsed.data.date}`);
  revalidatePath("/");

  return { success: true };
}


/**
 * Atualiza o horário (createdAt) de um log existente.
 *
 * 1. Valida o payload com updateLogTimeSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica autorização via getLogOwner
 * 4. Se log não encontrado, retorna "Registro não encontrado"
 * 5. Se não autorizado, retorna "Não autorizado"
 * 6. Constrói novo timestamp a partir de date + time
 * 7. Atualiza o createdAt no banco
 * 8. Invalida o cache da rota do dia
 * 9. Retorna resultado estruturado
 */
export async function updateLogTime(input: unknown): Promise<ActionResult> {
  const parsed = updateLogTimeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const owner = await getLogOwner(parsed.data.logId);

  if (!owner) {
    return { success: false, error: "Registro não encontrado" };
  }
  if (owner.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  const newCreatedAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);

  await updateLogCreatedAt(parsed.data.logId, newCreatedAt);
  revalidatePath(`/day/${parsed.data.date}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * Busca o status de todos os dias de um mês para o usuário autenticado.
 * Usado pela visualização mensal do calendário na tela principal.
 *
 * @param year - Ano (ex: 2025)
 * @param month - Mês 1-indexado (1=janeiro, 12=dezembro)
 */
export async function getMonthStatusAction(year: number, month: number): Promise<DayStatus[]> {
  const userId = await getCurrentUserId();
  return getMonthStatus(userId, year, month);
}
