import { beforeEach, expect, it, vi } from "vitest";
import { createPastLog } from "../logs";
import { getCurrentUserId } from "@/lib/auth";
import { upsertDay, insertLog } from "@/lib/db/queries/logs";
import { createPastLogSchema } from "@/lib/validation/log.schema";

vi.mock("@/lib/auth", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/db/queries/logs", () => ({ upsertDay: vi.fn(), insertLog: vi.fn() }));
vi.mock("@/lib/db/queries/weekPlans", () => ({}));
vi.mock("@/lib/db/queries/months", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/utils/taskRhythm", () => ({ rhythmToday: () => "2026-10-27" }));
const input = { date: "2026-10-26", time: "08:30", timezoneOffset: 180, content: "  Entreguei o relatório  " };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUserId).mockResolvedValue("owner");
  vi.mocked(upsertDay).mockResolvedValue({ id: "day" } as Awaited<ReturnType<typeof upsertDay>>);
  vi.mocked(insertLog).mockImplementation(async data => ({ ...data, id: "log", weekPlanTaskId: null }) as Awaited<ReturnType<typeof insertLog>>);
});
it.each([
  ["00:30", "2026-10-26T03:30:00.000Z"],
  ["23:30", "2026-10-27T02:30:00.000Z"],
])("salva data e horário %s em uma única inserção, na conta autenticada", async (time, iso) => {
  const result = await createPastLog({ ...input, time, userId: "intruder", dayId: "foreign" });
  expect(upsertDay).toHaveBeenCalledWith("owner", "2026-10-26");
  expect(insertLog).toHaveBeenCalledExactlyOnceWith({ dayId: "day", content: "Entreguei o relatório", createdAt: new Date(iso), weekPlanTaskId: null });
  expect(result).toMatchObject({ success: true, log: { id: "log", createdAt: new Date(iso), tags: [] } });
});
it.each(["2026-10-27", "2026-10-28"])("não grava hoje/futuro pelo fluxo retroativo: %s", async date => {
  expect(await createPastLog({ ...input, date })).toMatchObject({ success: false });
  expect(insertLog).not.toHaveBeenCalled();
});
it.each([{ date: "2026-02-30" }, { time: "24:00" }, { time: "" }, { timezoneOffset: undefined }, { content: "  " }])("rejeita dados inválidos %j", async patch => {
  expect(createPastLogSchema.safeParse({ ...input, ...patch }).success).toBe(false);
  expect(await createPastLog({ ...input, ...patch })).toMatchObject({ success: false });
  expect(upsertDay).not.toHaveBeenCalled();
});
it("não grava sem autenticação", async () => {
  vi.mocked(getCurrentUserId).mockRejectedValue(new Error("unauthenticated"));
  await expect(createPastLog(input)).rejects.toThrow("unauthenticated");
  expect(insertLog).not.toHaveBeenCalled();
});
it("retorna erro quando a gravação falha", async () => {
  vi.mocked(insertLog).mockRejectedValue(new Error("db unavailable"));
  expect(await createPastLog(input)).toMatchObject({ success: false });
});
