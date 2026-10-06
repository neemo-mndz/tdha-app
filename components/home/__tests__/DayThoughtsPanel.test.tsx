import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DayThoughtsPanel } from "@/components/home/DayThoughtsPanel";
import { createDayThought, editDayThought, deleteDayThought } from "@/lib/actions/dayThoughts";

vi.mock("@/lib/actions/dayThoughts", () => ({
  createDayThought: vi.fn(), editDayThought: vi.fn(), deleteDayThought: vi.fn(),
}));
const entry = {
  id: "00000000-0000-4000-8000-000000000001", userId: "owner", date: "2026-10-06",
  content: "Comecei o dia mais focado.", createdAt: new Date("2026-10-06T11:00:00Z"),
};
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("Sobre o dia — interface", () => {
  it("adiciona outro pensamento preservando o da manhã e mostra horário de Brasília", async () => {
    vi.mocked(createDayThought).mockResolvedValue({ success: true, entry: { ...entry, id: "second", content: "Almocei bem." } });
    render(<DayThoughtsPanel date={entry.date} initialEntries={[entry]} />);
    expect(screen.getByText("08:00")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Um pensamento agora"), { target: { value: "Almocei bem." } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar pensamento" }));
    await screen.findByText("Almocei bem.");
    expect(screen.getByText(entry.content)).toBeInTheDocument();
    expect(screen.getByLabelText("Um pensamento agora")).toHaveValue("");
  });
  it("preserva o rascunho quando o servidor falha", async () => {
    vi.mocked(createDayThought).mockRejectedValue(new Error("Network"));
    render(<DayThoughtsPanel date={entry.date} initialEntries={[]} />);
    fireEvent.change(screen.getByLabelText("Um pensamento agora"), { target: { value: "Quero testar uma receita." } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar pensamento" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Um pensamento agora")).toHaveValue("Quero testar uma receita.");
    expect(screen.getByRole("button", { name: "Guardar pensamento" })).toBeEnabled();
  });
  it("edita uma entrada e pede confirmação antes de excluir", async () => {
    vi.mocked(editDayThought).mockResolvedValue({ success: true, entry: { ...entry, content: "O dia correu bem." } });
    vi.mocked(deleteDayThought).mockResolvedValue({ success: true, entry });
    render(<DayThoughtsPanel date={entry.date} initialEntries={[entry]} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar pensamento das 08:00" }));
    fireEvent.change(screen.getByLabelText("Editar pensamento"), { target: { value: "O dia correu bem." } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alteração" }));
    await screen.findByText("O dia correu bem.");
    fireEvent.click(screen.getByRole("button", { name: "Excluir pensamento das 08:00" }));
    expect(deleteDayThought).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Sim, excluir" }));
    await waitFor(() => expect(screen.queryByText("O dia correu bem.")).not.toBeInTheDocument());
  });
});
