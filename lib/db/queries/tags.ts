import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tags, logTags } from "@/drizzle/schema";

export type Tag = { id: string; name: string; createdAt: Date };

/**
 * Cria uma nova tag para o usuário.
 */
export async function createTag(userId: string, name: string): Promise<Tag> {
  const [tag] = await db.insert(tags).values({ userId, name }).returning();
  return tag;
}

/**
 * Retorna todas as tags de um usuário.
 */
export async function getUserTags(userId: string): Promise<Tag[]> {
  return db.select().from(tags).where(eq(tags.userId, userId));
}

/**
 * Busca uma tag pelo nome com comparação case-insensitive.
 * Usada para verificar duplicatas antes de criar nova tag.
 */
export async function findTagByName(
  userId: string,
  name: string
): Promise<Tag | undefined> {
  const [tag] = await db
    .select()
    .from(tags)
    .where(
      and(
        eq(tags.userId, userId),
        sql`lower(${tags.name}) = lower(${name})`
      )
    )
    .limit(1);
  return tag;
}

/**
 * Deleta uma tag pelo id (cascade remove associações em log_tags).
 */
export async function deleteTagById(tagId: string): Promise<void> {
  await db.delete(tags).where(eq(tags.id, tagId));
}

/**
 * Associa uma tag a um log entry.
 * Usa onConflictDoNothing para idempotência (associação duplicada é no-op).
 */
export async function addTagToLog(logId: string, tagId: string): Promise<void> {
  await db.insert(logTags).values({ logId, tagId }).onConflictDoNothing();
}

/**
 * Remove a associação entre uma tag e um log entry.
 */
export async function removeTagFromLog(logId: string, tagId: string): Promise<void> {
  await db
    .delete(logTags)
    .where(and(eq(logTags.logId, logId), eq(logTags.tagId, tagId)));
}

/**
 * Retorna todas as tags associadas a um log entry específico.
 */
export async function getTagsForLog(logId: string): Promise<Tag[]> {
  const result = await db
    .select({ id: tags.id, name: tags.name, createdAt: tags.createdAt })
    .from(logTags)
    .innerJoin(tags, eq(logTags.tagId, tags.id))
    .where(eq(logTags.logId, logId));
  return result;
}

/**
 * Retorna todas as tags do usuário com a contagem de logs associados.
 * Usado no TagManager para exibir quantos registros usam cada tag.
 */
export async function getTagWithLogCount(
  userId: string
): Promise<(Tag & { logCount: number })[]> {
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      createdAt: tags.createdAt,
      logCount: sql<number>`count(${logTags.logId})::int`,
    })
    .from(tags)
    .leftJoin(logTags, eq(logTags.tagId, tags.id))
    .where(eq(tags.userId, userId))
    .groupBy(tags.id, tags.name, tags.createdAt);
  return result;
}
