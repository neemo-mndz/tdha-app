import { z } from "zod";

const tagNameSchema = z
  .string()
  .min(1, "O nome da tag não pode ser vazio")
  .max(30, "O nome da tag deve ter no máximo 30 caracteres")
  .refine((s) => s.trim().length > 0, "O nome não pode conter apenas espaços")
  .transform((s) => s.trim());

const logIdSchema = z.string().uuid("logId deve ser um UUID válido");
const tagIdSchema = z.string().uuid("tagId deve ser um UUID válido");
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato yyyy-MM-dd");

export const createTagSchema = z.object({
  name: tagNameSchema,
});

export const addTagToLogSchema = z.object({
  logId: logIdSchema,
  tagId: tagIdSchema,
  date: dateSchema,
});

export const removeTagFromLogSchema = z.object({
  logId: logIdSchema,
  tagId: tagIdSchema,
  date: dateSchema,
});

export const deleteTagSchema = z.object({
  tagId: tagIdSchema,
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type AddTagToLogInput = z.infer<typeof addTagToLogSchema>;
export type RemoveTagFromLogInput = z.infer<typeof removeTagFromLogSchema>;
export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
