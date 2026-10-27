// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/drizzle/schema";
import { getDayLogs, insertLog, upsertDay } from "../logs";

const enabled = process.env.AGENDA_INTEGRATION === "1"
  && process.env.AGENDA_TEST_BRANCH === "br-morning-darkness-acmbzml7" && !!process.env.DATABASE_URL;
const owner = randomUUID();
describe.skipIf(!enabled)("registros passados — banco isolado", () => {
  beforeAll(async () => {
    await db.insert(users).values({ id: owner, email: `past-${owner}@example.invalid`, passwordHash: "integration-test-not-login" });
  }, 60000);
  afterAll(async () => { await db.delete(users).where(eq(users.id, owner)); }, 60000);
  it("persiste horário, mantém a data civil e retorna em ordem cronológica apenas para o dono", async () => {
    const day = await upsertDay(owner, "2026-10-26");
    await insertLog({ dayId: day.id, content: "Atividade às 23:30", createdAt: new Date("2026-10-27T02:30:00Z") });
    await insertLog({ dayId: day.id, content: "Atividade às 08:30", createdAt: new Date("2026-10-26T11:30:00Z") });
    const [entries, nextDay, anotherUser] = await Promise.all([
      getDayLogs(owner, "2026-10-26"), getDayLogs(owner, "2026-10-27"), getDayLogs(randomUUID(), "2026-10-26"),
    ]);
    expect(entries.map(log => log.content)).toEqual(["Atividade às 08:30", "Atividade às 23:30"]);
    expect(entries[1].createdAt.toISOString()).toBe("2026-10-27T02:30:00.000Z");
    expect(nextDay).toHaveLength(0);
    expect(anotherUser).toHaveLength(0);
  }, 180000);
});
