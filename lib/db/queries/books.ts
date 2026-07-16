import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { books } from "@/drizzle/schema";
import type { Book } from "@/drizzle/schema";
import type {
  CurrentBookDisplay,
  QueuedBookDisplay,
  FinishedBookDisplay,
} from "@/lib/types/reading";

/**
 * Retorna o livro atual (status "reading") do usuário, ou null se não houver.
 * No máximo 1 livro atual por usuário (enforced via Server Actions).
 */
export async function getCurrentBook(
  userId: string
): Promise<CurrentBookDisplay | null> {
  const [result] = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      progress: books.progress,
      startedAt: books.startedAt,
    })
    .from(books)
    .where(and(eq(books.userId, userId), eq(books.status, "reading")))
    .limit(1);

  if (!result) return null;

  return {
    id: result.id,
    title: result.title,
    author: result.author,
    progress: result.progress,
    startedAt: result.startedAt?.toISOString() ?? "",
  };
}

/**
 * Retorna os livros na fila do usuário (status "queued"),
 * em ordem de adição (mais antigo primeiro).
 */
export async function getQueuedBooks(
  userId: string
): Promise<QueuedBookDisplay[]> {
  const results = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      createdAt: books.createdAt,
    })
    .from(books)
    .where(and(eq(books.userId, userId), eq(books.status, "queued")))
    .orderBy(asc(books.createdAt));

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    author: r.author,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Retorna os livros concluídos do usuário (status "finished"),
 * em ordem cronológica reversa (conclusão mais recente primeiro).
 */
export async function getFinishedBooks(
  userId: string
): Promise<FinishedBookDisplay[]> {
  const results = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      rating: books.rating,
      review: books.review,
      finishedAt: books.finishedAt,
    })
    .from(books)
    .where(and(eq(books.userId, userId), eq(books.status, "finished")))
    .orderBy(desc(books.finishedAt));

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    author: r.author,
    rating: r.rating,
    review: r.review,
    finishedAt: r.finishedAt?.toISOString() ?? "",
  }));
}

/**
 * Insere um novo livro para o usuário.
 * O campo startedAt é preenchido automaticamente se status === "reading".
 */
export async function insertBook(input: {
  userId: string;
  title: string;
  author?: string | null;
  status: string;
}): Promise<Book> {
  const [book] = await db
    .insert(books)
    .values({
      userId: input.userId,
      title: input.title,
      author: input.author ?? null,
      status: input.status,
      startedAt: input.status === "reading" ? new Date() : null,
    })
    .returning();

  return book;
}

/**
 * Atualiza o status de um livro, com campos extras opcionais
 * (startedAt, finishedAt, rating, review).
 */
export async function updateBookStatus(
  bookId: string,
  status: string,
  extras?: {
    startedAt?: Date | null;
    finishedAt?: Date | null;
    rating?: number | null;
    review?: string | null;
  }
): Promise<void> {
  await db
    .update(books)
    .set({
      status,
      ...extras,
    })
    .where(eq(books.id, bookId));
}

/**
 * Atualiza o campo de progresso do livro (texto livre, max 50 chars).
 */
export async function updateBookProgress(
  bookId: string,
  progress: string | null
): Promise<void> {
  await db
    .update(books)
    .set({ progress })
    .where(eq(books.id, bookId));
}

/**
 * Remove um livro do banco de dados.
 * Cascade deleta registros de leitura e notas associados.
 */
export async function deleteBook(bookId: string): Promise<void> {
  await db.delete(books).where(eq(books.id, bookId));
}

/**
 * Retorna o userId do dono de um livro.
 * Usado para verificação de autorização nas Server Actions.
 */
export async function getBookOwner(
  bookId: string
): Promise<{ userId: string } | undefined> {
  const [result] = await db
    .select({ userId: books.userId })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  return result;
}

/**
 * Retorna um livro pelo ID com userId e status.
 * Usado pelas Server Actions para verificar status antes de mutações.
 */
export async function getBookById(
  bookId: string
): Promise<{ id: string; userId: string; status: string } | undefined> {
  const [result] = await db
    .select({
      id: books.id,
      userId: books.userId,
      status: books.status,
    })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  return result;
}
