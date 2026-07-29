"use server";

import { revalidatePath } from "next/cache";
import {
  createTagSchema,
  addTagToLogSchema,
  removeTagFromLogSchema,
  deleteTagSchema,
} from "@/lib/validation/tag.schema";
import {
  createTag as createTagInDb,
  getUserTags as getUserTagsFromDb,
  getTagWithLogCount,
  findTagByName,
  deleteTagById,
  addTagToLog as addTagToLogInDb,
  removeTagFromLog as removeTagFromLogInDb,
} from "@/lib/db/queries/tags";
import { getLogOwner } from "@/lib/db/queries/logs";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { tags } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Cria uma nova tag para o usuário autenticado.
 *
 * 1. Valida o payload com createTagSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica duplicata case-insensitive via findTagByName
 * 4. Se duplicata existe, retorna erro "Tag já existe"
 * 5. Insere a tag no banco
 * 6. Invalida cache
 * 7. Retorna resultado com a tag criada
 */
export async function createTag(
  input: unknown
): Promise<ActionResult & { tag?: { id: string; name: string; createdAt: Date } }> {
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Verificar duplicata case-insensitive
  const existing = await findTagByName(userId, parsed.data.name);
  if (existing) {
    return { success: false, error: "Tag já existe" };
  }

  const tag = await createTagInDb(userId, parsed.data.name);

  revalidatePath("/");

  return { success: true, tag };
}

/**
 * Associa uma tag a um log entry.
 *
 * 1. Valida o payload com addTagToLogSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica ownership do log via getLogOwner
 * 4. Se não autorizado, retorna erro
 * 5. Insere associação com onConflictDoNothing (idempotente)
 * 6. Invalida cache da rota do dia
 * 7. Retorna resultado estruturado
 */
export async function addTagToLog(input: unknown): Promise<ActionResult> {
  const parsed = addTagToLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const owner = await getLogOwner(parsed.data.logId);

  if (owner?.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  await addTagToLogInDb(parsed.data.logId, parsed.data.tagId);

  revalidatePath(`/day/${parsed.data.date}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * Remove a associação entre uma tag e um log entry.
 *
 * 1. Valida o payload com removeTagFromLogSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica ownership do log via getLogOwner
 * 4. Se não autorizado, retorna erro
 * 5. Deleta row em log_tags
 * 6. Invalida cache da rota do dia
 * 7. Retorna resultado estruturado
 */
export async function removeTagFromLog(input: unknown): Promise<ActionResult> {
  const parsed = removeTagFromLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const owner = await getLogOwner(parsed.data.logId);

  if (owner?.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  await removeTagFromLogInDb(parsed.data.logId, parsed.data.tagId);

  revalidatePath(`/day/${parsed.data.date}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * Deleta uma tag do usuário (cascade remove associações em log_tags).
 *
 * 1. Valida o payload com deleteTagSchema (Zod)
 * 2. Obtém o userId do usuário autenticado
 * 3. Verifica ownership da tag (tag.userId === userId)
 * 4. Se não autorizado, retorna erro
 * 5. Deleta a tag (cascade em log_tags)
 * 6. Invalida cache
 * 7. Retorna resultado estruturado
 */
export async function deleteTag(input: unknown): Promise<ActionResult> {
  const parsed = deleteTagSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Verificar ownership da tag
  const [tag] = await db
    .select({ userId: tags.userId })
    .from(tags)
    .where(eq(tags.id, parsed.data.tagId))
    .limit(1);

  if (!tag || tag.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  await deleteTagById(parsed.data.tagId);

  revalidatePath("/");

  return { success: true };
}

/**
 * Retorna todas as tags do usuário autenticado.
 * Usado para sugestões no TagEditor e filtro no History Screen.
 */
export async function getUserTags(): Promise<
  { id: string; name: string; createdAt: Date }[]
> {
  const userId = await getCurrentUserId();
  return getUserTagsFromDb(userId);
}

/**
 * Retorna todas as tags do usuário autenticado com a contagem real de logs associados.
 * Usado no TagManager para exibir a contagem precisa antes de confirmar deleção.
 */
export async function getTagsWithLogCount(): Promise<
  { id: string; name: string; createdAt: Date; logCount: number }[]
> {
  const userId = await getCurrentUserId();
  return getTagWithLogCount(userId);
}
