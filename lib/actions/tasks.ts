"use server";

import { revalidatePath } from "next/cache";
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
} from "@/lib/validation/task.schema";
import {
  insertTask,
  updateTaskById,
  deleteTaskById,
  getTaskOwner,
} from "@/lib/db/queries/tasks";
import { getCurrentUserId } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Cria uma nova tarefa na biblioteca do usuário autenticado.
 *
 * 1. Valida o payload com createTaskSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Insere a tarefa no banco
 * 4. Invalida o cache da rota principal
 * 5. Retorna resultado estruturado
 */
export async function createTask(input: unknown): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  await insertTask({
    userId,
    name: parsed.data.name,
    defaultQty: parsed.data.defaultQty,
  });

  revalidatePath("/");

  return { success: true };
}

/**
 * Atualiza nome e/ou quantidade padrão de uma tarefa existente.
 *
 * 1. Valida o payload com updateTaskSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica autorização via getTaskOwner
 * 4. Se não autorizado, retorna erro
 * 5. Atualiza a tarefa no banco
 * 6. Invalida o cache da rota principal
 * 7. Retorna resultado estruturado
 */
export async function updateTask(input: unknown): Promise<ActionResult> {
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const owner = await getTaskOwner(parsed.data.taskId);

  if (owner?.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  const { taskId, ...data } = parsed.data;
  await updateTaskById(taskId, data);

  revalidatePath("/");

  return { success: true };
}

/**
 * Remove uma tarefa da biblioteca do usuário autenticado.
 *
 * 1. Valida o payload com deleteTaskSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica autorização via getTaskOwner
 * 4. Se não autorizado, retorna erro
 * 5. Tenta excluir a tarefa do banco (try/catch para restrict FK)
 * 6. Invalida o cache da rota principal
 * 7. Retorna resultado estruturado
 */
export async function deleteTask(input: unknown): Promise<ActionResult> {
  const parsed = deleteTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const owner = await getTaskOwner(parsed.data.taskId);

  if (owner?.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    await deleteTaskById(parsed.data.taskId);
  } catch {
    return {
      success: false,
      error: "Não é possível remover uma tarefa que está em uso em um plano semanal",
    };
  }

  revalidatePath("/");

  return { success: true };
}
