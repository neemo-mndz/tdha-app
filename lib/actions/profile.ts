"use server";

import { revalidatePath } from "next/cache";
import {
  updateNameSchema,
  updateAvatarSchema,
  updateBirthDateSchema,
  changePasswordSchema,
} from "@/lib/validation/profile.schema";
import {
  updateUserName,
  updateUserAvatar,
  updateUserBirthDate,
  updateUserPasswordHash,
  getUserPasswordHash,
} from "@/lib/db/queries/profile";
import { getCurrentUserId } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Atualiza o nome de exibição do usuário autenticado.
 *
 * 1. Valida o input via updateNameSchema (trim + min 2 + max 100)
 * 2. Verifica autenticação
 * 3. Atualiza nome no banco
 * 4. Revalida cache da página de perfil
 */
export async function updateName(input: unknown): Promise<ActionResult> {
  const parsed = updateNameSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  try {
    await updateUserName(userId, parsed.data.name);
  } catch {
    return { success: false, error: "Erro ao salvar. Tente novamente." };
  }

  revalidatePath("/profile");
  return { success: true };
}

/**
 * Atualiza o avatar do usuário autenticado.
 *
 * 1. Valida o input via updateAvatarSchema (data URL + max size)
 * 2. Verifica autenticação
 * 3. Atualiza avatarUrl no banco
 * 4. Revalida cache da página de perfil
 */
export async function updateAvatar(input: unknown): Promise<ActionResult> {
  const parsed = updateAvatarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  try {
    await updateUserAvatar(userId, parsed.data.avatarUrl);
  } catch {
    return { success: false, error: "Erro ao salvar foto. Tente novamente." };
  }

  revalidatePath("/profile");
  return { success: true };
}

/**
 * Atualiza a data de nascimento do usuário autenticado.
 *
 * 1. Valida o input via updateBirthDateSchema (formato + idade [13,120])
 * 2. Verifica autenticação
 * 3. Atualiza birthDate no banco
 * 4. Revalida cache da página de perfil
 */
export async function updateBirthDate(input: unknown): Promise<ActionResult> {
  const parsed = updateBirthDateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  try {
    await updateUserBirthDate(userId, parsed.data.birthDate);
  } catch {
    return { success: false, error: "Erro ao salvar. Tente novamente." };
  }

  revalidatePath("/profile");
  return { success: true };
}

/**
 * Altera a senha do usuário autenticado.
 *
 * 1. Valida o input via changePasswordSchema (currentPassword + newPassword [8,128])
 * 2. Verifica autenticação
 * 3. Busca hash atual da senha
 * 4. Verifica se a senha atual está correta via verifyPassword
 * 5. Gera hash da nova senha via hashPassword
 * 6. Atualiza hash no banco
 * 7. Revalida cache da página de perfil
 */
export async function changePassword(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  const currentHash = await getUserPasswordHash(userId);
  if (!currentHash) {
    return { success: false, error: "Erro ao alterar senha. Tente novamente." };
  }

  const isValid = await verifyPassword(parsed.data.currentPassword, currentHash);
  if (!isValid) {
    return { success: false, error: "Senha atual incorreta" };
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  try {
    await updateUserPasswordHash(userId, newHash);
  } catch {
    return { success: false, error: "Erro ao alterar senha. Tente novamente." };
  }

  revalidatePath("/profile");
  return { success: true };
}
