"use server";

import { revalidatePath } from "next/cache";
import {
  addBookSchema,
  startReadingSchema,
  updateProgressSchema,
  finishBookSchema,
  removeBookSchema,
} from "@/lib/validation/book.schema";
import {
  getCurrentBook,
  insertBook,
  updateBookStatus,
  updateBookProgress as updateBookProgressQuery,
  deleteBook,
  getBookOwner,
  getBookById,
} from "@/lib/db/queries/books";
import { getCurrentUserId } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Adiciona um livro à fila do usuário com status "queued".
 *
 * 1. Valida input via addBookSchema
 * 2. Verifica autenticação
 * 3. Insere livro com status "queued"
 * 4. Revalida path
 */
export async function addBookToQueue(input: unknown): Promise<ActionResult> {
  const parsed = addBookSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  await insertBook({
    userId,
    title: parsed.data.title,
    author: parsed.data.author ?? null,
    status: "queued",
  });

  revalidatePath("/reading");
  return { success: true };
}

/**
 * Adiciona um livro diretamente como atual (status "reading").
 * Se já existe livro atual, demove-o para "queued".
 *
 * 1. Valida input via addBookSchema
 * 2. Verifica autenticação
 * 3. Se já existe livro atual → muda status para "queued"
 * 4. Insere novo livro com status "reading" + startedAt
 * 5. Revalida path
 */
export async function addBookAsCurrent(input: unknown): Promise<ActionResult> {
  const parsed = addBookSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Se já existe livro atual, demove para fila
  const currentBook = await getCurrentBook(userId);
  if (currentBook) {
    await updateBookStatus(currentBook.id, "queued");
  }

  // Insere novo como atual
  await insertBook({
    userId,
    title: parsed.data.title,
    author: parsed.data.author ?? null,
    status: "reading",
  });

  revalidatePath("/reading");
  return { success: true };
}

/**
 * Promove um livro da fila para livro atual.
 * Se já existe livro atual, demove-o para "queued".
 *
 * 1. Valida input via startReadingSchema
 * 2. Verifica autenticação
 * 3. Verifica ownership do livro + status "queued"
 * 4. Se já existe livro atual → muda status para "queued"
 * 5. Muda target para "reading" + startedAt
 * 6. Revalida path
 */
export async function startReadingFromQueue(
  input: unknown
): Promise<ActionResult> {
  const parsed = startReadingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Verifica ownership
  const owner = await getBookOwner(parsed.data.bookId);
  if (!owner || owner.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  // Verifica que o livro está na fila
  const targetBook = await getBookById(parsed.data.bookId);
  if (!targetBook || targetBook.status !== "queued") {
    return { success: false, error: "Este livro não está na fila" };
  }

  // Se já existe livro atual, demove para fila
  const currentBook = await getCurrentBook(userId);
  if (currentBook) {
    await updateBookStatus(currentBook.id, "queued");
  }

  // Promove o target para reading
  await updateBookStatus(parsed.data.bookId, "reading", {
    startedAt: new Date(),
  });

  revalidatePath("/reading");
  return { success: true };
}

/**
 * Atualiza o campo de progresso do livro atual.
 *
 * 1. Valida input via updateProgressSchema
 * 2. Verifica autenticação
 * 3. Verifica ownership + status "reading"
 * 4. Atualiza progress
 * 5. Revalida path
 */
export async function updateBookProgress(
  input: unknown
): Promise<ActionResult> {
  const parsed = updateProgressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Verifica ownership
  const owner = await getBookOwner(parsed.data.bookId);
  if (!owner || owner.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  // Verifica que o livro está sendo lido
  const book = await getBookById(parsed.data.bookId);
  if (!book || book.status !== "reading") {
    return {
      success: false,
      error: "Este livro não está sendo lido no momento",
    };
  }

  await updateBookProgressQuery(
    parsed.data.bookId,
    parsed.data.progress ?? null
  );

  revalidatePath("/reading");
  return { success: true };
}

/**
 * Conclui o livro atual, movendo para "finished".
 *
 * 1. Valida input via finishBookSchema
 * 2. Verifica autenticação
 * 3. Verifica ownership + status "reading"
 * 4. Atualiza para "finished" + finishedAt + rating/review opcionais
 * 5. Revalida path
 */
export async function finishCurrentBook(input: unknown): Promise<ActionResult> {
  const parsed = finishBookSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Verifica ownership
  const owner = await getBookOwner(parsed.data.bookId);
  if (!owner || owner.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  // Verifica que o livro está sendo lido
  const book = await getBookById(parsed.data.bookId);
  if (!book || book.status !== "reading") {
    return {
      success: false,
      error: "Este livro não está sendo lido no momento",
    };
  }

  await updateBookStatus(parsed.data.bookId, "finished", {
    finishedAt: new Date(),
    rating: parsed.data.rating ?? null,
    review: parsed.data.review ?? null,
  });

  revalidatePath("/reading");
  return { success: true };
}

/**
 * Remove um livro da fila.
 *
 * 1. Valida input via removeBookSchema
 * 2. Verifica autenticação
 * 3. Verifica ownership + status "queued"
 * 4. Deleta o livro
 * 5. Revalida path
 */
export async function removeBookFromQueue(
  input: unknown
): Promise<ActionResult> {
  const parsed = removeBookSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Verifica ownership
  const owner = await getBookOwner(parsed.data.bookId);
  if (!owner || owner.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  // Verifica que o livro está na fila
  const book = await getBookById(parsed.data.bookId);
  if (!book || book.status !== "queued") {
    return { success: false, error: "Este livro não está na fila" };
  }

  await deleteBook(parsed.data.bookId);

  revalidatePath("/reading");
  return { success: true };
}
