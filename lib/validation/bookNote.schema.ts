import { z } from "zod";

const contentSchema = z
  .string()
  .min(1, "A nota não pode ser vazia")
  .max(1000, "A nota deve ter no máximo 1000 caracteres")
  .refine((s) => s.trim().length > 0, "A nota não pode conter apenas espaços");

const bookIdSchema = z.string().uuid("bookId deve ser um UUID válido");
const noteIdSchema = z.string().uuid("noteId deve ser um UUID válido");

export const createBookNoteSchema = z.object({
  bookId: bookIdSchema,
  content: contentSchema,
});

export const deleteBookNoteSchema = z.object({
  noteId: noteIdSchema,
});

export type CreateBookNoteInput = z.infer<typeof createBookNoteSchema>;
export type DeleteBookNoteInput = z.infer<typeof deleteBookNoteSchema>;
