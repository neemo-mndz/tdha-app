"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { insertThought, updateThought, removeThought } from "@/lib/db/queries/dayThoughts";
import { createThoughtSchema, updateThoughtSchema, deleteThoughtSchema } from "@/lib/validation/dayThought.schema";
import type { DayThought } from "@/drizzle/schema";

type Result = { success: true; entry: DayThought } | { success: false; error: string };

function refresh(date: string) {
  revalidatePath("/");
  revalidatePath(`/day/${date}`);
}

export async function createDayThought(input: unknown): Promise<Result> {
  const parsed = createThoughtSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    const userId = await getCurrentUserId();
    const entry = await insertThought(userId, parsed.data.date, parsed.data.content);
    refresh(parsed.data.date);
    return { success: true, entry };
  } catch {
    return { success: false, error: "Não foi possível salvar. Seu texto foi mantido; tente novamente." };
  }
}

export async function editDayThought(input: unknown): Promise<Result> {
  const parsed = updateThoughtSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    const userId = await getCurrentUserId();
    const { date, id, content } = parsed.data;
    const entry = await updateThought(userId, date, id, content);
    if (!entry) return { success: false, error: "Pensamento não encontrado." };
    refresh(date);
    return { success: true, entry };
  } catch {
    return { success: false, error: "Não foi possível editar. Tente novamente." };
  }
}

export async function deleteDayThought(input: unknown): Promise<Result> {
  const parsed = deleteThoughtSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    const userId = await getCurrentUserId();
    const { date, id } = parsed.data;
    const entry = await removeThought(userId, date, id);
    if (!entry) return { success: false, error: "Pensamento não encontrado." };
    refresh(date);
    return { success: true, entry };
  } catch {
    return { success: false, error: "Não foi possível excluir. Tente novamente." };
  }
}
