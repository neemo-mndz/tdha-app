"use server";

import { revalidatePath } from "next/cache";
import {
  createBookNoteSchema,
  deleteBookNoteSchema,
} from "@/lib/validation/bookNote.schema";
import {
  insertBookNote,
  deleteBookNote as deleteBookNoteQuery,
  getNoteOwner,
} from "@/lib/db/queries/bookNotes";
import { getBookById } from "@/lib/db/queries/books";
import { getCurrentUserId } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Cria uma nota de leitura associada ao livro atual do usuário.
 *
 * 1. Valida input via createBookNoteSchema (bookId + content)
 * 2. Verifica autenticação
 * 3. Verifica que o livro existe, pertence ao usuário e tem status "reading"
 * 4. Insere nota com createdAt automático
 * 5. Revalida path "/reading"
 */
export async function createBookNote(input: unknown): Promise<ActionResult> {
  const parsed = createBookNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Verifica ownership + status "reading"
  const book = await getBookById(parsed.data.bookId);
  if (!book || book.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  if (book.status !== "reading") {
    return {
      success: false,
      error: "Selecione ou adicione um livro para criar notas",
    };
  }

  await insertBookNote(parsed.data.bookId, parsed.data.content);

  revalidatePath("/reading");
  return { success: true };
}

/**
 * Exclui uma nota de leitura do usuário.
 *
 * 1. Valida input via deleteBookNoteSchema (noteId)
 * 2. Verifica autenticação
 * 3. Verifica ownership da nota via getNoteOwner (join notes → books)
 * 4. Deleta nota
 * 5. Revalida path "/reading"
 */
export async function deleteBookNote(input: unknown): Promise<ActionResult> {
  const parsed = deleteBookNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  // Verifica ownership da nota (sem revelar existência se não pertence ao usuário)
  const owner = await getNoteOwner(parsed.data.noteId);
  if (!owner || owner.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  await deleteBookNoteQuery(parsed.data.noteId);

  revalidatePath("/reading");
  return { success: true };
}
