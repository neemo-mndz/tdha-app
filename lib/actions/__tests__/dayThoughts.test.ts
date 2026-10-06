import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDayThought, editDayThought, deleteDayThought } from "@/lib/actions/dayThoughts";
import { getCurrentUserId } from "@/lib/auth";
import { insertThought, updateThought, removeThought } from "@/lib/db/queries/dayThoughts";

vi.mock("@/lib/auth", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db/queries/dayThoughts", () => ({
  insertThought: vi.fn(), updateThought: vi.fn(), removeThought: vi.fn(),
}));
const date = "2026-10-06";
const id = "00000000-0000-4000-8000-000000000001";
const entry = { id, userId: "owner", date, content: "Me senti focado.", createdAt: new Date() };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUserId).mockResolvedValue("owner");
  vi.mocked(insertThought).mockResolvedValue(entry);
  vi.mocked(updateThought).mockResolvedValue(entry);
  vi.mocked(removeThought).mockResolvedValue(entry);
});

describe("Sobre o dia — persistência e autenticação", () => {
  it("salva entradas independentes usando o usuário autenticado", async () => {
    await createDayThought({ date, content: "  Manhã tranquila.  ", userId: "intruder" });
    await createDayThought({ date, content: "Almocei bem." });
    expect(insertThought).toHaveBeenNthCalledWith(1, "owner", date, "Manhã tranquila.");
    expect(insertThought).toHaveBeenNthCalledWith(2, "owner", date, "Almocei bem.");
  });
  it.each(["", "   ", "x".repeat(5001)])("rejeita texto vazio ou acima do limite", async (content) => {
    expect((await createDayThought({ date, content })).success).toBe(false);
    expect(insertThought).not.toHaveBeenCalled();
  });
  it("rejeita uma data inexistente antes de persistir", async () => {
    expect((await createDayThought({ date: "2026-02-30", content: "Teste" })).success).toBe(false);
    expect(insertThought).not.toHaveBeenCalled();
  });
  it("exige usuário e data para editar e excluir", async () => {
    await editDayThought({ id, date, content: "Texto editado", userId: "intruder" });
    await deleteDayThought({ id, date, userId: "intruder" });
    expect(updateThought).toHaveBeenCalledWith("owner", date, id, "Texto editado");
    expect(removeThought).toHaveBeenCalledWith("owner", date, id);
  });
  it("não informa sucesso para entrada de outro usuário ou dia", async () => {
    vi.mocked(updateThought).mockResolvedValue(undefined);
    vi.mocked(removeThought).mockResolvedValue(undefined);
    expect((await editDayThought({ id, date, content: "Teste" })).success).toBe(false);
    expect((await deleteDayThought({ id, date })).success).toBe(false);
  });
  it("não escreve no banco sem autenticação", async () => {
    vi.mocked(getCurrentUserId).mockRejectedValue(new Error("Unauthenticated"));
    expect((await createDayThought({ date, content: "Teste" })).success).toBe(false);
    expect(insertThought).not.toHaveBeenCalled();
  });
});
