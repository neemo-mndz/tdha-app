import { eq, desc, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookNotes, books } from "@/drizzle/schema";
import type { BookNote } from "@/drizzle/schema";
import type { BookNoteDisplay } from "@/lib/types/reading";

/**
 * Retorna todas as notas de um livro em ordem cronológica reversa (mais recente primeiro).
 */
export async function getBookNotes(bookId: string): Promise<BookNoteDisplay[]> {
  const result = await db
    .select({
      id: bookNotes.id,
      content: bookNotes.content,
      createdAt: bookNotes.createdAt,
    })
    .from(bookNotes)
    .where(eq(bookNotes.bookId, bookId))
    .orderBy(desc(bookNotes.createdAt));

  return result.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Cria uma nova nota de leitura associada a um livro.
 */
export async function insertBookNote(
  bookId: string,
  content: string
): Promise<BookNote> {
  const [note] = await db.insert(bookNotes).values({ bookId, content }).returning();
  return note;
}

/**
 * Exclui uma nota de leitura pelo seu id.
 */
export async function deleteBookNote(noteId: string): Promise<void> {
  await db.delete(bookNotes).where(eq(bookNotes.id, noteId));
}

/**
 * Retorna o userId do dono de uma nota via join bookNotes → books → userId.
 * Usado para verificação de autorização nas Server Actions.
 */
export async function getNoteOwner(
  noteId: string
): Promise<{ userId: string } | undefined> {
  const [result] = await db
    .select({ userId: books.userId })
    .from(bookNotes)
    .innerJoin(books, eq(bookNotes.bookId, books.id))
    .where(eq(bookNotes.id, noteId))
    .limit(1);
  return result;
}

/**
 * Retorna o total de notas associadas a um livro.
 */
export async function countBookNotes(bookId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(bookNotes)
    .where(eq(bookNotes.bookId, bookId));
  return result?.total ?? 0;
}
