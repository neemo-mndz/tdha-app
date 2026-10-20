import { describe, it, expect } from "vitest";
import { agendaEntrySchema } from "../agenda.schema";
const valid = { title: " Reunião ", date: "2026-10-19", tags: ["trabalho", "casal"], startTime: "14:00", endTime: "15:00" };
describe("agenda", () => {
  it("normaliza título, tags repetidas e período pelo horário", () => {
    const data = agendaEntrySchema.parse({ ...valid, tags: ["trabalho", "trabalho"], period: "morning", userId: "intruder" });
    expect(data).toMatchObject({ title: "Reunião", tags: ["trabalho"], period: "afternoon" });
    expect(data).not.toHaveProperty("userId");
  });
  it.each([
    { title: " " }, { title: "x".repeat(161) }, { date: "2026-02-30" }, { date: "invalid" },
    { tags: [] }, { tags: ["invalida"] }, { startTime: "25:00" }, { endTime: "14:00" },
    { startTime: null, endTime: "15:00" }, { notes: "x".repeat(2001) },
  ])("rejeita dados inválidos: %j", patch => {
    expect(agendaEntrySchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it("aceita uma tarefa realizada no passado e preserva a omissão de situação para clientes anteriores", () => {
    expect(agendaEntrySchema.parse({ ...valid, date: "2026-10-01", completed: true }).completed).toBe(true);
    expect(agendaEntrySchema.parse(valid).completed).toBeUndefined();
    expect(agendaEntrySchema.safeParse({ ...valid, completed: "true" }).success).toBe(false);
  });
  it("permite planejar por período sem exigir horário", () => {
    expect(agendaEntrySchema.parse({ title: "Passeio", date: "2026-10-25", tags: ["casal"], period: "morning" }))
      .toMatchObject({ period: "morning", startTime: null, endTime: null, notes: "" });
  });
});
