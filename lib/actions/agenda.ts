"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { agendaEntrySchema, agendaIdSchema } from "@/lib/validation/agenda.schema";
import { insertAgenda, updateAgenda, completeAgenda, removeAgenda } from "@/lib/db/queries/agenda";
import type { AgendaEntry } from "@/lib/agenda/model";

type Result = { success: true; entry: AgendaEntry } | { success: false; error: string };
type StoredEntry = NonNullable<Awaited<ReturnType<typeof updateAgenda>>>;

async function persist(operation: (userId: string) => Promise<StoredEntry | undefined>): Promise<Result> {
  const userId = await getCurrentUserId();
  try {
    const entry = await operation(userId);
    if (!entry) return { success: false, error: "Compromisso não encontrado." };
    revalidatePath("/agenda");
    return { success: true, entry };
  } catch {
    return { success: false, error: "Não foi possível salvar. Suas informações foram mantidas; tente novamente." };
  }
}
export async function saveAgendaEntry(input: unknown, id?: string): Promise<Result> {
  const parsed = agendaEntrySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  if (id !== undefined && !agendaIdSchema.safeParse(id).success) return { success: false, error: "Compromisso inválido." };
  return persist(userId => id === undefined ? insertAgenda(userId, parsed.data) : updateAgenda(userId, id, parsed.data));
}
export async function setAgendaCompleted(input: unknown): Promise<Result> {
  const parsed = z.object({ id: agendaIdSchema, completed: z.boolean() }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Compromisso inválido." };
  return persist(userId => completeAgenda(userId, parsed.data.id, parsed.data.completed));
}
export async function deleteAgendaEntry(input: unknown): Promise<Result> {
  const parsed = agendaIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Compromisso inválido." };
  return persist(userId => removeAgenda(userId, parsed.data));
}
