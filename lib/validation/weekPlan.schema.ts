import { z } from "zod";

const weekStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato yyyy-MM-dd");

const planTaskSchema = z.object({
  taskId: z.string().uuid("taskId deve ser um UUID válido"),
  goal: z.number().int().min(1, "Meta mínima é 1").max(99, "Meta máxima é 99"),
});

export const saveWeekPlanSchema = z.object({
  weekStart: weekStartSchema,
  tasks: z.array(planTaskSchema),
});

export const bumpTaskSchema = z.object({
  weekPlanTaskId: z.string().uuid("weekPlanTaskId deve ser um UUID válido"),
});

export type SaveWeekPlanInput = z.infer<typeof saveWeekPlanSchema>;
export type BumpTaskInput = z.infer<typeof bumpTaskSchema>;
export type PlanTaskInput = z.infer<typeof planTaskSchema>;
