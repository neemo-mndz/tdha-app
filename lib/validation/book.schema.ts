import { z } from "zod";

const titleSchema = z
  .string()
  .min(1, "Título é obrigatório")
  .max(200, "Título deve ter no máximo 200 caracteres")
  .refine((s) => s.trim().length > 0, "Título não pode conter apenas espaços");

const authorSchema = z
  .string()
  .max(200, "Autor deve ter no máximo 200 caracteres")
  .nullable()
  .optional();

const progressSchema = z
  .string()
  .max(50, "Progresso deve ter no máximo 50 caracteres")
  .nullable()
  .optional();

const bookIdSchema = z.string().uuid("bookId deve ser um UUID válido");

export const addBookSchema = z.object({
  title: titleSchema,
  author: authorSchema,
});

export const updateProgressSchema = z.object({
  bookId: bookIdSchema,
  progress: progressSchema,
});

export const finishBookSchema = z.object({
  bookId: bookIdSchema,
  rating: z.number().int().min(1).max(5).nullable().optional(),
  review: z.string().max(2000).nullable().optional(),
});

export const startReadingSchema = z.object({
  bookId: bookIdSchema,
});

export const removeBookSchema = z.object({
  bookId: bookIdSchema,
});

export type AddBookInput = z.infer<typeof addBookSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type FinishBookInput = z.infer<typeof finishBookSchema>;
export type StartReadingInput = z.infer<typeof startReadingSchema>;
export type RemoveBookInput = z.infer<typeof removeBookSchema>;
