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
      completedDates: weekPlanTasks.completedDates,
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
    completedDates: r.completedDates ?? [],
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
 * Sincroniza tarefas do plano, preservando progresso e vínculos das mantidas.
 */
export async function syncWeekPlanTasks(
  weekPlanId: string,
  taskList: Array<{ taskId: string; goal: number }>
): Promise<void> {
  // Keep IDs, progress and log links for tasks that remain in the plan.
  const existing = await db.select().from(weekPlanTasks)
    .where(eq(weekPlanTasks.weekPlanId, weekPlanId));
  const selected = new Set(taskList.map((t) => t.taskId));
  const changes = [
    ...existing.filter((task) => !selected.has(task.taskId)).map((task) =>
      db.delete(weekPlanTasks).where(eq(weekPlanTasks.id, task.id))),
    ...taskList.map((task) => {
      const previous = existing.find((t) => t.taskId === task.taskId);
      return previous
        ? db.update(weekPlanTasks).set({ goal: task.goal }).where(eq(weekPlanTasks.id, previous.id))
        : db.insert(weekPlanTasks).values({ weekPlanId, taskId: task.taskId, goal: task.goal })
          .onConflictDoUpdate({ target: [weekPlanTasks.weekPlanId, weekPlanTasks.taskId], set: { goal: task.goal } });
    }),
  ];
  // Neon batch runs these writes in a single transaction.
  const [first, ...rest] = changes;
  if (first) await db.batch([first, ...rest]);
}

/**
 * Incrementa o campo `done` em 1 para uma week_plan_task.
 */
export async function bumpWeekPlanTask(weekPlanTaskId: string, date?: string): Promise<void> {
  await db
    .update(weekPlanTasks)
    .set({
      done: sql`GREATEST(${weekPlanTasks.done} + 1, cardinality(${weekPlanTasks.completedDates}) + CASE WHEN ${date ?? null}::text IS NOT NULL AND NOT (${date ?? null}::text = ANY(${weekPlanTasks.completedDates})) THEN 1 ELSE 0 END)`,
      ...(date ? { completedDates: sql`CASE WHEN ${date} = ANY(${weekPlanTasks.completedDates}) THEN ${weekPlanTasks.completedDates} ELSE array_append(${weekPlanTasks.completedDates}, ${date}) END` } : {}),
    })
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
    .set({ done: sql`GREATEST(${weekPlanTasks.done} - 1, cardinality(${weekPlanTasks.completedDates}))` })
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

/** Toggle using one UPDATE so parallel requests never overwrite a stale array. */
export async function toggleWeekPlanTaskDay(weekPlanTaskId: string, date: string): Promise<void> {
  const present = sql`${date} = ANY(${weekPlanTasks.completedDates})`;
  const nextDates = sql`CASE WHEN ${present} THEN array_remove(${weekPlanTasks.completedDates}, ${date}) ELSE array_append(${weekPlanTasks.completedDates}, ${date}) END`;
  await db.update(weekPlanTasks).set({
    completedDates: nextDates,
    done: sql`GREATEST(cardinality(${nextDates}), ${weekPlanTasks.done} + CASE WHEN ${present} THEN -1 ELSE 1 END)`,
  }).where(eq(weekPlanTasks.id, weekPlanTaskId));
}
