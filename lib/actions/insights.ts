"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { upsertDay, getDayInsight as getDayInsightQuery, updateDayInsight } from "@/lib/db/queries/insights";

const insightSchema = z.object({
  content: z.string().min(1, "O insight não pode estar vazio").max(2000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Busca o insight de uma data específica para o usuário autenticado.
 */
export async function getDayInsight(date: string): Promise<{ success: true; insight: string | null } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    const result = await getDayInsightQuery(userId, date);
    return { success: true, insight: result ?? null };
  } catch (err) {
    return { success: false, error: "Erro ao buscar insight" };
  }
}

/**
 * Salva ou atualiza o insight de uma data específica para o usuário autenticado.
 */
export async function saveInsight(input: unknown): Promise<ActionResult> {
  const parsed = insightSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const userId = await getCurrentUserId();
    const day = await upsertDay(userId, parsed.data.date);
    await updateDayInsight(day.id, parsed.data.content);

    revalidatePath(`/day/${parsed.data.date}`);
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    return { success: false, error: "Erro ao salvar insight" };
  }
}

/**
 * Exclui o insight de uma data específica para o usuário autenticado.
 */
export async function deleteInsight(date: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    const day = await upsertDay(userId, date); // Ensure day exists (will create if not, but setting insight to null is fine)
    await updateDayInsight(day.id, null);

    revalidatePath(`/day/${date}`);
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    return { success: false, error: "Erro ao excluir insight" };
  }
}