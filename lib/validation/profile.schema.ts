import { z } from "zod";
import { differenceInYears } from "date-fns";

export const updateNameSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres")
    ),
});

export const updateAvatarSchema = z.object({
  avatarUrl: z
    .string()
    .startsWith("data:image/", "Formato de imagem inválido")
    .max(500_000, "Imagem processada muito grande"),
});

export const updateBirthDateSchema = z.object({
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }, "Data inválida")
    .refine((dateStr) => {
      const age = differenceInYears(new Date(), new Date(dateStr));
      return age >= 13 && age <= 120;
    }, "Idade deve estar entre 13 e 120 anos"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres"),
});

export const getWeekReportSchema = z.object({
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .min(1, "Selecione pelo menos um dia")
    .max(7),
});

export type UpdateNameInput = z.infer<typeof updateNameSchema>;
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
export type UpdateBirthDateInput = z.infer<typeof updateBirthDateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GetWeekReportInput = z.infer<typeof getWeekReportSchema>;
