import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato yyyy-MM-dd");

const bookIdSchema = z.string().uuid("bookId deve ser um UUID válido");

export const toggleReadingDaySchema = z.object({
  bookId: bookIdSchema,
  date: dateSchema,
});

export type ToggleReadingDayInput = z.infer<typeof toggleReadingDaySchema>;
