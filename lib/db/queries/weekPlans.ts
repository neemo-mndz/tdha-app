import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { weekPlans, weekPlanTasks, tasks } from "@/drizzle/schema";
import type { WeekPlan } from "@/drizzle/schema";
import type { WeekPlanSummary, ActiveTaskDisplay } from "@/lib/types/tasks";

/**
 * Busca o plano semanal de um usuário para uma semana específica,
 * incluindo as tarefas ativas com join na tabela tasks para obter o nome.
 */
export async function getWeekPlan(
  userId: string,
  weekStart: string
): Promise<WeekPlanSummary | null> {
  const [plan] = await db
    .select()
    .from(weekPlans)
    .where(and(eq(weekPlans.userId, userId), eq(weekPlans.weekStart, weekStart)))
    .limit(1);

  if (!plan) return null;

  const rows = await db
    .select({
      weekPlanTaskId: weekPlanTasks.id,
      taskId: weekPlanTasks.taskId,
      name: tasks.name,
      goal: weekPlanTasks.goal,
      done: weekPlanTasks.done,
    })
    .from(weekPlanTasks)
    .innerJoin(tasks, eq(weekPlanTasks.taskId, tasks.id))
    .where(eq(weekPlanTasks.weekPlanId, plan.id));

  const activeTasks: ActiveTaskDisplay[] = rows.map((r) => ({
    weekPlanTaskId: r.weekPlanTaskId,
    taskId: r.taskId,
    name: r.name,
    goal: r.goal,
    done: r.done,
  }));

  return {
    weekPlanId: plan.id,
    weekStart: plan.weekStart,
    tasks: activeTasks,
  };
}

/**
 * Cria ou retorna o WeekPlan existente para a combinação userId + weekStart.
 * Usa INSERT ... ON CONFLICT DO NOTHING seguido de SELECT para garantir
 * atomicidade sem race condition em ambiente serverless.
 */
export async function upsertWeekPlan(
  userId: string,
  weekStart: string
): Promise<WeekPlan> {
  await db
    .insert(weekPlans)
    .values({ userId, weekStart })
    .onConflictDoNothing();

  const [plan] = await db
    .select()
    .from(weekPlans)
    .where(and(eq(weekPlans.userId, userId), eq(weekPlans.weekStart, weekStart)))
    .limit(1);

  return plan;
}

/**
 * Sincroniza as tarefas do plano semanal: remove todas as existentes
 * e insere o novo batch (sync completo / replace-all).
 */
export async function syncWeekPlanTasks(
  weekPlanId: string,
  taskList: Array<{ taskId: string; goal: number }>
): Promise<void> {
  await db.delete(weekPlanTasks).where(eq(weekPlanTasks.weekPlanId, weekPlanId));

  if (taskList.length > 0) {
    await db.insert(weekPlanTasks).values(
      taskList.map((t) => ({
        weekPlanId,
        taskId: t.taskId,
        goal: t.goal,
      }))
    );
  }
}

/**
 * Incrementa o campo `done` em 1 para uma week_plan_task.
 */
export async function bumpWeekPlanTask(weekPlanTaskId: string): Promise<void> {
  await db
    .update(weekPlanTasks)
    .set({ done: sql`${weekPlanTasks.done} + 1` })
    .where(eq(weekPlanTasks.id, weekPlanTaskId));
}

/**
 * Decrementa o campo `done` em 1, com floor em 0 (nunca fica negativo).
 */
export async function decrementWeekPlanTask(
  weekPlanTaskId: string
): Promise<void> {
  await db
    .update(weekPlanTasks)
    .set({ done: sql`GREATEST(${weekPlanTasks.done} - 1, 0)` })
    .where(eq(weekPlanTasks.id, weekPlanTaskId));
}

/**
 * Retorna o userId e weekStart do dono de uma week_plan_task.
 * Usado para verificação de autorização nas Server Actions.
 */
export async function getWeekPlanTaskOwner(
  weekPlanTaskId: string
): Promise<{ userId: string; weekStart: string } | undefined> {
  const [result] = await db
    .select({
      userId: weekPlans.userId,
      weekStart: weekPlans.weekStart,
    })
    .from(weekPlanTasks)
    .innerJoin(weekPlans, eq(weekPlanTasks.weekPlanId, weekPlans.id))
    .where(eq(weekPlanTasks.id, weekPlanTaskId))
    .limit(1);

  return result;
}
