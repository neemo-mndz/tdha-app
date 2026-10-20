// @vitest-environment node
// Runs only with an explicitly selected, isolated Neon test branch.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { agendaEntries, users } from "@/drizzle/schema";
import { completeAgenda, getAgendaWeek, insertAgenda, removeAgenda, updateAgenda } from "../agenda";
import { agendaEntrySchema } from "@/lib/validation/agenda.schema";
const enabled = process.env.AGENDA_INTEGRATION === "1" && !!process.env.AGENDA_TEST_BRANCH && !!process.env.DATABASE_URL;
const owner=randomUUID(); const stranger=randomUUID();

describe.skipIf(!enabled)("agenda — integração no branch isolado", () => {
  beforeAll(async () => {
    await db.insert(users).values([
      { id: owner, email: `agenda-${owner}@example.invalid`, passwordHash: "integration-test-not-login" },
      { id: stranger, email: `agenda-${stranger}@example.invalid`, passwordHash: "integration-test-not-login" },
    ]);
  }, 30000);
  afterAll(async () => { await db.delete(users).where(inArray(users.id, [owner, stranger])); }, 30000);
  it("persiste, isola usuários, reagenda e exclui sem afetar outra conta", async () => {
    const input=agendaEntrySchema.parse({ title: "Reunião de teste", date: "2026-10-19", tags: ["trabalho", "casal", "pessoal", "psicologa"], startTime: "10:00" });
    const entry=await insertAgenda(owner, input);
    const [own, other, intrusion, intrusionComplete, intrusionDelete] = await Promise.all([
      getAgendaWeek(owner, "2026-10-19", "2026-10-25"),
      getAgendaWeek(stranger, "2026-10-19", "2026-10-25"),
      updateAgenda(stranger, entry.id, { ...input, title: "Intrusão" }),
      completeAgenda(stranger, entry.id, true), removeAgenda(stranger, entry.id),
    ]);
    expect(own).toHaveLength(1); expect(own[0].tags).toContain("psicologa"); expect(other).toHaveLength(0);
    expect(intrusion).toBeUndefined(); expect(intrusionComplete).toBeUndefined(); expect(intrusionDelete).toBeUndefined();
    expect((await completeAgenda(owner, entry.id, true))?.completed).toBe(true);
    expect((await updateAgenda(owner, entry.id, { ...input, date: "2026-10-27" }))?.date).toBe("2026-10-27");
    const [previousWeek, nextWeek] = await Promise.all([
      getAgendaWeek(owner, "2026-10-19", "2026-10-25"), getAgendaWeek(owner, "2026-10-26", "2026-11-01"),
    ]);
    expect(previousWeek).toHaveLength(0); expect(nextWeek).toHaveLength(1);
    expect((await removeAgenda(owner, entry.id))?.id).toBe(entry.id);
    expect(await getAgendaWeek(owner, "2026-10-26", "2026-11-01")).toHaveLength(0);
  }, 180000);
  it("aplica as restrições de tags e horários também no banco", async () => {
    const input=agendaEntrySchema.parse({ title: "Validação", date: "2026-10-19", tags: ["casal"] });
    const entry=await insertAgenda(owner, input);
    await expect(db.update(agendaEntries).set({ tags: [] }).where(eq(agendaEntries.id, entry.id))).rejects.toThrow();
    await expect(db.update(agendaEntries).set({ startTime: "25:00" }).where(eq(agendaEntries.id, entry.id))).rejects.toThrow();
    await removeAgenda(owner, entry.id);
  }, 30000);
});
