import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "Campo obrigatório")
  .max(254, "Insira um email válido")
  .transform((val) => val.trim().toLowerCase())
  .pipe(
    z
      .string()
      .regex(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        "Insira um email válido"
      )
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Campo obrigatório"),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1, "Campo obrigatório")
      .min(8, "A senha precisa ter entre 8 e 128 caracteres")
      .max(128, "A senha precisa ter entre 8 e 128 caracteres"),
    confirmPassword: z.string().min(1, "Campo obrigatório"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
