import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { agendaEntries } from "@/drizzle/schema";
import type { AgendaEntry } from "@/lib/agenda/model";
import type { AgendaInput } from "@/lib/validation/agenda.schema";

const fields = { id: agendaEntries.id, date: agendaEntries.date, title: agendaEntries.title,
  notes: agendaEntries.notes, tags: agendaEntries.tags, period: agendaEntries.period,
  startTime: agendaEntries.startTime, endTime: agendaEntries.endTime, completed: agendaEntries.completed };
export async function getAgendaWeek(userId: string, start: string, end: string) {
  return db.select(fields).from(agendaEntries).where(and(eq(agendaEntries.userId, userId),
    gte(agendaEntries.date, start), lte(agendaEntries.date, end))).orderBy(asc(agendaEntries.date), asc(agendaEntries.startTime), asc(agendaEntries.createdAt));
}
export async function insertAgenda(userId: string, input: AgendaInput) {
  const [entry] = await db.insert(agendaEntries).values({ ...input, userId }).returning(fields);
  return entry;
}
export async function updateAgenda(userId: string, id: string, input: AgendaInput): Promise<AgendaEntry | undefined> {
  const [entry] = await db.update(agendaEntries).set(input)
    .where(and(eq(agendaEntries.id, id), eq(agendaEntries.userId, userId))).returning(fields);
  return entry;
}
export async function completeAgenda(userId: string, id: string, completed: boolean): Promise<AgendaEntry | undefined> {
  const [entry] = await db.update(agendaEntries).set({ completed })
    .where(and(eq(agendaEntries.id, id), eq(agendaEntries.userId, userId))).returning(fields);
  return entry;
}
export async function removeAgenda(userId: string, id: string): Promise<AgendaEntry | undefined> {
  const [entry] = await db.delete(agendaEntries)
    .where(and(eq(agendaEntries.id, id), eq(agendaEntries.userId, userId))).returning(fields);
  return entry;
}
