import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { dayThoughts } from "@/drizzle/schema";
import type { DayThought } from "@/drizzle/schema";

export async function getDayThoughts(userId: string, date: string) {
  return db.select().from(dayThoughts)
    .where(and(eq(dayThoughts.userId, userId), eq(dayThoughts.date, date)))
    .orderBy(asc(dayThoughts.createdAt), asc(dayThoughts.id));
}

export async function insertThought(userId: string, date: string, content: string) {
  const [entry] = await db.insert(dayThoughts).values({ userId, date, content }).returning();
  return entry;
}

export async function updateThought(userId: string, date: string, id: string, content: string): Promise<DayThought | undefined> {
  const [entry] = await db.update(dayThoughts).set({ content })
    .where(and(eq(dayThoughts.userId, userId), eq(dayThoughts.date, date), eq(dayThoughts.id, id)))
    .returning();
  return entry;
}

export async function removeThought(userId: string, date: string, id: string): Promise<DayThought | undefined> {
  const [entry] = await db.delete(dayThoughts)
    .where(and(eq(dayThoughts.userId, userId), eq(dayThoughts.date, date), eq(dayThoughts.id, id)))
    .returning();
  return entry;
}
