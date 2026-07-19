import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/drizzle/schema";
import type { UserProfile } from "@/lib/types/profile";

/**
 * Retorna o perfil do usuário pelo ID.
 * Retorna null se o usuário não for encontrado.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      birthDate: users.birthDate,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}

/**
 * Atualiza o nome de exibição do usuário.
 */
export async function updateUserName(userId: string, name: string): Promise<void> {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

/**
 * Atualiza o avatar do usuário (armazenado como base64 data URL).
 */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
}

/**
 * Atualiza a data de nascimento do usuário.
 */
export async function updateUserBirthDate(userId: string, birthDate: string): Promise<void> {
  await db.update(users).set({ birthDate }).where(eq(users.id, userId));
}

/**
 * Atualiza o hash de senha do usuário.
 */
export async function updateUserPasswordHash(userId: string, hash: string): Promise<void> {
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));
}

/**
 * Retorna o hash da senha do usuário para verificação.
 * Retorna null se o usuário não for encontrado.
 */
export async function getUserPasswordHash(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.passwordHash ?? null;
}
