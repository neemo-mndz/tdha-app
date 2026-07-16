import { z } from "zod";

const contentSchema = z
  .string()
  .min(1, "O conteúdo do log não pode ser vazio")
  .max(2000, "O conteúdo deve ter no máximo 2000 caracteres")
  .refine((s) => s.trim().length > 0, "O conteúdo não pode conter apenas espaços em branco");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato yyyy-MM-dd");

const logIdSchema = z.string().uuid("logId deve ser um UUID válido");

export const createLogSchema = z.object({
  content: contentSchema,
  date: dateSchema,
  weekPlanTaskId: z.string().uuid().nullable().optional(),
});

export const updateLogSchema = z.object({
  logId: logIdSchema,
  content: contentSchema,
  date: dateSchema,
});

export const deleteLogSchema = z.object({
  logId: logIdSchema,
  date: dateSchema,
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
export type DeleteLogInput = z.infer<typeof deleteLogSchema>;
