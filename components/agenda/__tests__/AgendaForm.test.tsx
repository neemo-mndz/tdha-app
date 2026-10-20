import { beforeEach, expect, it, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { AgendaForm } from "../AgendaForm";
import { saveAgendaEntry } from "@/lib/actions/agenda";
vi.mock("@/lib/actions/agenda", () => ({ saveAgendaEntry: vi.fn(), deleteAgendaEntry: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
});
it("preserva o formulário quando a rede falha e permite novo envio", async () => {
  vi.mocked(saveAgendaEntry).mockRejectedValueOnce(new Error("offline"));
  const saved = vi.fn();
  render(<AgendaForm date="2026-10-19" onSaved={saved} onDeleted={vi.fn()} onClose={vi.fn()} />);
  const title=screen.getByLabelText("Título");
  fireEvent.change(title, { target: { value: "Jantar em casal" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("informações foram mantidas");
  expect(title).toHaveValue("Jantar em casal");
  expect(saved).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvar" })).not.toBeDisabled());
});

it("salva uma tarefa já realizada em uma data passada", async () => {
  const saved = vi.fn();
  const entry = { id: "00000000-0000-4000-8000-000000000001", title: "Relatório entregue", date: "2026-10-16", tags: ["trabalho"] as const, notes: "", period: "anytime" as const, startTime: null, endTime: null, completed: true };
  vi.mocked(saveAgendaEntry).mockResolvedValue({ success: true, entry: { ...entry, tags: ["trabalho"] } });
  render(<AgendaForm date="2026-10-16" defaultTag="trabalho" onSaved={saved} onDeleted={vi.fn()} onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Relatório entregue" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Já realizada" }));
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(saveAgendaEntry).toHaveBeenCalledWith(expect.objectContaining({ title: "Relatório entregue", date: "2026-10-16", tags: ["trabalho"], completed: true }), undefined);
});
it("mantém a situação de uma tarefa realizada ao editar o título", async () => {
  const entry = { id: "00000000-0000-4000-8000-000000000001", title: "Relatório", date: "2026-10-16", tags: ["trabalho"] as ("trabalho")[], notes: "", period: "anytime" as const, startTime: null, endTime: null, completed: true };
  vi.mocked(saveAgendaEntry).mockResolvedValue({ success: true, entry });
  render(<AgendaForm date="2026-10-16" entry={entry} onSaved={vi.fn()} onDeleted={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByRole("checkbox", { name: "Já realizada" })).toBeChecked();
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Relatório revisado" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(saveAgendaEntry).toHaveBeenCalledWith(expect.objectContaining({ title: "Relatório revisado", completed: true }), entry.id));
});
