import { z } from "zod";
import { isValid, parseISO, format } from "date-fns";

export const thoughtDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((date) => isValid(parseISO(date)) && format(parseISO(date), "yyyy-MM-dd") === date, "Data inválida.");

const content = z.string().trim().min(1, "Escreva um pensamento antes de salvar.")
  .max(5000, "O pensamento deve ter no máximo 5000 caracteres.");

export const createThoughtSchema = z.object({ date: thoughtDateSchema, content });
export const updateThoughtSchema = createThoughtSchema.extend({ id: z.string().uuid() });
export const deleteThoughtSchema = z.object({ date: thoughtDateSchema, id: z.string().uuid() });
