import { z } from "zod";

const taskNameSchema = z
  .string()
  .min(1, "O nome da tarefa não pode ser vazio")
  .max(100, "O nome deve ter no máximo 100 caracteres")
  .refine((s) => s.trim().length > 0, "O nome não pode conter apenas espaços em branco");

const defaultQtySchema = z
  .number()
  .int("A quantidade deve ser um número inteiro")
  .min(1, "A quantidade mínima é 1")
  .max(99, "A quantidade máxima é 99");

export const createTaskSchema = z.object({
  name: taskNameSchema,
  defaultQty: defaultQtySchema,
});

export const updateTaskSchema = z.object({
  taskId: z.string().uuid("taskId deve ser um UUID válido"),
  name: taskNameSchema.optional(),
  defaultQty: defaultQtySchema.optional(),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().uuid("taskId deve ser um UUID válido"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
