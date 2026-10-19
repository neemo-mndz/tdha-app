import { beforeEach, expect, it, vi } from "vitest";
import { saveAgendaEntry, setAgendaCompleted, deleteAgendaEntry } from "../agenda";
import { getCurrentUserId } from "@/lib/auth";
import { insertAgenda, updateAgenda, completeAgenda, removeAgenda } from "@/lib/db/queries/agenda";
vi.mock("@/lib/auth", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db/queries/agenda", () => ({ insertAgenda: vi.fn(), updateAgenda: vi.fn(), completeAgenda: vi.fn(), removeAgenda: vi.fn() }));
const id="00000000-0000-4000-8000-000000000001";
const input={ title: "Reunião", date: "2026-10-19", tags: ["trabalho"] };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCurrentUserId).mockResolvedValue("owner"); });
it("ignora identidades recebidas do cliente e escopa todas as mutações ao usuário autenticado", async () => {
  await saveAgendaEntry({ ...input, userId: "intruder" });
  expect(insertAgenda).toHaveBeenCalledWith("owner", expect.not.objectContaining({ userId: "intruder" }));
  await saveAgendaEntry(input, id);
  expect(updateAgenda).toHaveBeenCalledWith("owner", id, expect.any(Object));
  await setAgendaCompleted({ id, completed: true, userId: "intruder" });
  expect(completeAgenda).toHaveBeenCalledWith("owner", id, true);
  await deleteAgendaEntry(id);
  expect(removeAgenda).toHaveBeenCalledWith("owner", id);
});
it("não grava sem autenticação", async () => {
  vi.mocked(getCurrentUserId).mockRejectedValue(new Error("Unauthenticated"));
  await expect(saveAgendaEntry(input)).rejects.toThrow();
  expect(insertAgenda).not.toHaveBeenCalled();
});
it("não relata sucesso para compromisso de outro usuário e rejeita id inválido", async () => {
  vi.mocked(updateAgenda).mockResolvedValue(undefined);
  expect((await saveAgendaEntry(input, id)).success).toBe(false);
  expect((await saveAgendaEntry(input, "not-a-uuid")).success).toBe(false);
  expect((await deleteAgendaEntry("not-a-uuid")).success).toBe(false);
});
