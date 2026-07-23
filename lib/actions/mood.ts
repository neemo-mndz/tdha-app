"use server";

import { revalidatePath } from "next/cache";
import { saveMoodSchema, saveMoodNoteSchema } from "@/lib/validation/mood.schema";
import { upsertDay } from "@/lib/db/queries/logs";
import { updateDayMood, updateDayMoodNote } from "@/lib/db/queries/mood";
import { getCurrentUserId } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Salva ou limpa o humor do dia.
 *
 * 1. Valida payload com saveMoodSchema (Zod)
 * 2. Obtém userId via getCurrentUserId()
 * 3. Chama upsertDay(userId, date) para garantir que a row existe
 * 4. Chama updateDayMood(dayId, mood) — mood pode ser null (clear)
 * 5. revalidatePath("/")
 * 6. Retorna { success: true }
 */
export async function saveMood(input: unknown): Promise<ActionResult> {
  const parsed = saveMoodSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  try {
    const day = await upsertDay(userId, parsed.data.date);
    await updateDayMood(day.id, parsed.data.mood);
  } catch {
    return { success: false, error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/");

  return { success: true };
}

/**
 * Salva ou limpa a nota de humor do dia.
 *
 * 1. Valida payload com saveMoodNoteSchema (Zod)
 * 2. Obtém userId via getCurrentUserId()
 * 3. Chama upsertDay(userId, date) para garantir que a row existe
 * 4. Chama updateDayMoodNote(dayId, note) — note pode ser null (clear)
 * 5. revalidatePath("/")
 * 6. Retorna { success: true }
 */
export async function saveMoodNote(input: unknown): Promise<ActionResult> {
  const parsed = saveMoodNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();

  try {
    const day = await upsertDay(userId, parsed.data.date);
    await updateDayMoodNote(day.id, parsed.data.note);
  } catch {
    return { success: false, error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/");

  return { success: true };
}
