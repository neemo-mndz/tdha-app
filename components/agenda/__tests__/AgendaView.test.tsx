import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuickCaptureButton } from "@/components/logs/QuickCaptureButton";
import { AgendaView } from "../AgendaView";
import { usePathname } from "next/navigation";
import { setAgendaCompleted } from "@/lib/actions/agenda";
import type { AgendaEntry } from "@/lib/agenda/model";
vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/agenda"), useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/actions/agenda", () => ({ setAgendaCompleted: vi.fn(), saveAgendaEntry: vi.fn(), deleteAgendaEntry: vi.fn() }));
const entry: AgendaEntry={ id: "00000000-0000-4000-8000-000000000001", date: "2026-10-19", title: "Reunião", tags: ["trabalho", "pessoal"], notes: "Sala 2", period: "afternoon", startTime: "14:00", endTime: "15:00", completed: false };
const other: AgendaEntry={ ...entry, id: "00000000-0000-4000-8000-000000000002", title: "Cinema", tags: ["casal"], period: "evening", startTime: "20:00", endTime: null };
vi.mock("@/components/logs/QuickCaptureSheet", () => ({ QuickCaptureSheet: ({ open }: { open: boolean }) => open ? <div role="dialog">Captura instantânea</div> : null }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(usePathname).mockReturnValue("/agenda");
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
});
it("filtra por assunto sem perder compromissos com múltiplas tags", () => {
  render(<AgendaView initialEntries={[entry,other]} date="2026-10-19" today="2026-10-19" view="day" tag="trabalho" />);
  expect(screen.getByRole("button", { name: "Editar: Reunião" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Editar: Cinema" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Casal" })).toHaveAttribute("href", expect.stringContaining("tag=casal"));
  expect(screen.getByRole("region", { name: "Manhã" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Tarde" })).toHaveTextContent("Reunião");
});
it("não marca como concluído quando a gravação falha", async () => {
  vi.mocked(setAgendaCompleted).mockResolvedValue({ success: false, error: "Tente novamente." });
  render(<AgendaView initialEntries={[entry]} date="2026-10-19" today="2026-10-19" view="week" tag="all" />);
  fireEvent.click(screen.getByRole("button", { name: "Concluir: Reunião" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Tente novamente.");
  expect(screen.getByRole("button", { name: "Concluir: Reunião" })).toHaveAttribute("aria-pressed", "false");
});

it("o botão flutuante da agenda abre uma tarefa no dia e assunto selecionados", () => {
  render(<><AgendaView initialEntries={[]} date="2026-10-16" today="2026-10-20" view="day" tag="trabalho" /><QuickCaptureButton /></>);
  expect(screen.queryByRole("button", { name: "Captura rápida" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Nova tarefa ou compromisso" }));
  expect(screen.getByRole("dialog", { name: "Nova tarefa ou compromisso" })).toBeInTheDocument();
  expect(screen.getByLabelText("Data")).toHaveValue("2026-10-16");
  expect(screen.getByRole("checkbox", { name: "Trabalho" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Já realizada" })).not.toBeChecked();
});
it("mantém a captura rápida nas outras páginas após sair da agenda", () => {
  const { rerender } = render(<QuickCaptureButton />);
  expect(screen.queryByRole("button", { name: "Captura rápida" })).not.toBeInTheDocument();
  vi.mocked(usePathname).mockReturnValue("/");
  rerender(<QuickCaptureButton />);
  fireEvent.click(screen.getByRole("button", { name: "Captura rápida" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("Captura instantânea");
});

it("exibe e filtra os registros da Psicóloga", () => {
  const appointment: AgendaEntry = { ...entry, title: "Consulta", tags: ["psicologa"] };
  render(<AgendaView initialEntries={[entry, appointment]} date="2026-10-19" today="2026-10-19" view="day" tag="psicologa" />);
  expect(screen.getByRole("link", { name: "Psicóloga" })).toHaveAttribute("href", expect.stringContaining("tag=psicologa"));
  expect(screen.getByRole("button", { name: "Editar: Consulta" })).toHaveTextContent("Psicóloga");
  expect(screen.queryByRole("button", { name: "Editar: Reunião" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Nova tarefa ou compromisso" }));
  expect(screen.getByRole("checkbox", { name: "Psicóloga" })).toBeChecked();
});
