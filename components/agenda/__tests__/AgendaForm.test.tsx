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
  const title=screen.getByLabelText("O que você quer planejar?");
  fireEvent.change(title, { target: { value: "Jantar em casal" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar compromisso" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("informações foram mantidas");
  expect(title).toHaveValue("Jantar em casal");
  expect(saved).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvar compromisso" })).not.toBeDisabled());
});
