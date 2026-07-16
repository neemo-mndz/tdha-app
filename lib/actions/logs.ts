"use server";

import { revalidatePath } from "next/cache";
import {
  createLogSchema,
  updateLogSchema,
  deleteLogSchema,
} from "@/lib/validation/log.schema";
import {
  upsertDay,
  insertLog,
  updateLogById,
  deleteLogById,
  getLogOwner,
} from "@/lib/db/queries/logs";
import { getCurrentUserId } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

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
  const day = await upsertDay(userId, parsed.data.date);
  await insertLog({ dayId: day.id, content: parsed.data.content });

  revalidatePath(`/day/${parsed.data.date}`);

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

  await deleteLogById(parsed.data.logId);

  revalidatePath(`/day/${parsed.data.date}`);

  return { success: true };
}
