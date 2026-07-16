"use server";

import { revalidatePath } from "next/cache";
import { toggleReadingDaySchema } from "@/lib/validation/readingLog.schema";
import {
  hasReadingLog,
  insertReadingLog,
  deleteReadingLog,
} from "@/lib/db/queries/readingLogs";
import { getBookOwner } from "@/lib/db/queries/books";
import { getCurrentUserId } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Marca ou desmarca leitura de um dia (toggle).
 *
 * 1. Valida input via toggleReadingDaySchema (bookId UUID + date yyyy-MM-dd)
 * 2. Verifica autenticação
 * 3. Verifica ownership do livro (bookId pertence ao user)
 * 4. Verifica que o livro tem status "reading"
 * 5. Se registro existe → deleta (toggle off)
 * 6. Se não existe → insere (toggle on)
 * 7. Revalida path "/reading"
 */
export async function toggleReadingDay(input: unknown): Promise<ActionResult> {
  const parsed = toggleReadingDaySchema.safeParse(input);
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
    return {
      success: false,
      error: "Selecione ou adicione um livro antes de registrar leitura",
    };
  }

  // Verifica que o livro está com status "reading"
  const { getBookById } = await import("@/lib/db/queries/books");
  const book = await getBookById(parsed.data.bookId);
  if (!book || book.status !== "reading") {
    return {
      success: false,
      error: "Selecione ou adicione um livro antes de registrar leitura",
    };
  }

  // Toggle: se existe → deleta, se não → insere
  const exists = await hasReadingLog(parsed.data.bookId, parsed.data.date);

  if (exists) {
    await deleteReadingLog(parsed.data.bookId, parsed.data.date);
  } else {
    await insertReadingLog(parsed.data.bookId, parsed.data.date);
  }

  revalidatePath("/reading");
  return { success: true };
}
