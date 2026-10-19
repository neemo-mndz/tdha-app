import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AgendaView } from "../AgendaView";
import { setAgendaCompleted } from "@/lib/actions/agenda";
import type { AgendaEntry } from "@/lib/agenda/model";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/actions/agenda", () => ({ setAgendaCompleted: vi.fn() }));
const entry: AgendaEntry={ id: "00000000-0000-4000-8000-000000000001", date: "2026-10-19", title: "Reunião", tags: ["trabalho", "pessoal"], notes: "Sala 2", period: "afternoon", startTime: "14:00", endTime: "15:00", completed: false };
const other: AgendaEntry={ ...entry, id: "00000000-0000-4000-8000-000000000002", title: "Cinema", tags: ["casal"], period: "evening", startTime: "20:00", endTime: null };
beforeEach(() => vi.clearAllMocks());
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
