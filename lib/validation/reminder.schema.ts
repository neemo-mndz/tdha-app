import { z } from "zod";

export const createReminderSchema = z.object({
  hour: z
    .number()
    .int("A hora deve ser um número inteiro")
    .min(0, "A hora mínima é 0")
    .max(23, "A hora máxima é 23"),
  minute: z
    .number()
    .int("O minuto deve ser um número inteiro")
    .min(0, "O minuto mínimo é 0")
    .max(59, "O minuto máximo é 59"),
});

export const toggleReminderSchema = z.object({
  reminderId: z.string().uuid("reminderId deve ser um UUID válido"),
});

export const deleteReminderSchema = z.object({
  reminderId: z.string().uuid("reminderId deve ser um UUID válido"),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type ToggleReminderInput = z.infer<typeof toggleReminderSchema>;
export type DeleteReminderInput = z.infer<typeof deleteReminderSchema>;
