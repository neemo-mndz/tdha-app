import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/drizzle/schema";
import type { User } from "@/drizzle/schema";

/**
 * Normaliza email: lowercase + trim.
 * Garante consistência em buscas e inserções.
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Busca um usuário pelo email normalizado.
 * Retorna o registro completo do usuário ou undefined se não encontrado.
 */
export async function findUserByEmail(email: string): Promise<User | undefined> {
  const normalized = normalizeEmail(email);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  return user;
}

/**
 * Cria um novo usuário com email normalizado e password hash.
 * Retorna o id (UUID) do usuário criado.
 */
export async function createUser(
  email: string,
  passwordHash: string
): Promise<string> {
  const normalized = normalizeEmail(email);

  const [newUser] = await db
    .insert(users)
    .values({ email: normalized, passwordHash })
    .returning({ id: users.id });

  return newUser.id;
}

/**
 * Verifica se um email já está cadastrado no banco de dados.
 * Compara usando email normalizado (lowercase + trim).
 */
export async function emailExists(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);

  const [result] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  return result !== undefined;
}
