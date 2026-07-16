import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tasks } from "@/drizzle/schema";
import type { Task } from "@/drizzle/schema";

/**
 * Retorna todas as tarefas da biblioteca de um usuário,
 * em ordem cronológica crescente de criação.
 */
export async function getUserTasks(userId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.createdAt));
}

/**
 * Cria uma nova tarefa na biblioteca do usuário.
 */
export async function insertTask(input: {
  userId: string;
  name: string;
  defaultQty: number;
}): Promise<Task> {
  const [task] = await db.insert(tasks).values(input).returning();
  return task;
}

/**
 * Atualiza nome e/ou quantidade padrão de uma tarefa existente.
 */
export async function updateTaskById(
  taskId: string,
  data: { name?: string; defaultQty?: number }
): Promise<void> {
  await db.update(tasks).set(data).where(eq(tasks.id, taskId));
}

/**
 * Remove uma tarefa da biblioteca.
 * Pode falhar se houver week_plan_tasks referenciando (onDelete: restrict).
 */
export async function deleteTaskById(taskId: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, taskId));
}

/**
 * Retorna o userId do dono de uma tarefa.
 * Usado para verificação de autorização nas Server Actions.
 */
export async function getTaskOwner(
  taskId: string
): Promise<{ userId: string } | undefined> {
  const [result] = await db
    .select({ userId: tasks.userId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  return result;
}
