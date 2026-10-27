import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { LogsProvider, useLogs } from "../LogsProvider";
import { TodayLogsCard } from "../TodayLogsCard";
import { DailyLogPanel } from "../DailyLogPanel";
import { LogList } from "@/components/logs/LogList";
import { createPastLog, getLogsForDate } from "@/lib/actions/logs";
import type { LogWithTask } from "@/lib/db/queries/logs";

vi.mock("@/lib/actions/logs", () => ({ createPastLog: vi.fn(), getLogsForDate: vi.fn(), createLog: vi.fn() }));
vi.mock("@/components/logs/LogItem", () => ({ LogItem: ({ log }: { log: LogWithTask }) => <div data-testid="record">{log.content}</div> }));
const record = (id: string, content: string, hour = 11): LogWithTask => ({ id, content, dayId: "day", createdAt: new Date(Date.UTC(2026, 9, 26, hour)), weekPlanTaskId: null, taskName: null, tags: [] });
const todayLog = record("today", "Registro de hoje");
function Calendar() {
  const { setSelectedDate } = useLogs();
  return <>{[25, 26, 27, 28].map(day => <button key={day} onClick={() => setSelectedDate(new Date(2026, 9, day))}>Dia {day}</button>)}</>;
}
function Home() {
  return <LogsProvider todayStr="2026-10-27" initialLogs={[todayLog]}><Calendar /><TodayLogsCard /><DailyLogPanel activeTasks={[]} /></LogsProvider>;
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getLogsForDate).mockResolvedValue([]); });
function fill() {
  fireEvent.click(screen.getByRole("button", { name: "Adicionar atividade" }));
  fireEvent.change(screen.getByLabelText("Atividade"), { target: { value: "Relatório entregue" } });
  fireEvent.change(screen.getByLabelText("Horário"), { target: { value: "08:30" } });
}
it("seleciona ontem, adiciona atividade com horário e a inclui na lista sem alterar hoje", async () => {
  vi.mocked(createPastLog).mockResolvedValue({ success: true, log: record("new", "Relatório entregue") });
  render(<Home />);
  expect(screen.queryByRole("region", { name: "Atualizar dia anterior" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Dia 26" }));
  await screen.findByRole("button", { name: "Adicionar atividade" });
  expect(screen.queryByText("Registrar agora")).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Atualizar dia anterior" })).toHaveTextContent("26/10/2026");
  fill(); fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(screen.getByTestId("record")).toHaveTextContent("Relatório entregue"));
  expect(createPastLog).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-10-26", time: "08:30", content: "Relatório entregue" }));
  expect(screen.getByLabelText("Atividade")).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "Dia 27" }));
  expect(screen.getByTestId("record")).toHaveTextContent("Registro de hoje");
  fireEvent.click(screen.getByRole("button", { name: "Dia 28" }));
  await waitFor(() => expect(screen.queryByRole("region", { name: "Atualizar dia anterior" })).not.toBeInTheDocument());
});
it("mantém tarefa e horário se falhar e bloqueia envio duplicado", async () => {
  let finish!: (value: Awaited<ReturnType<typeof createPastLog>>) => void;
  vi.mocked(createPastLog).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<LogList initialLogs={[]} date="2026-10-26" isPast />);
  fill(); fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  fireEvent.submit(screen.getByLabelText("Atividade").closest("form")!);
  expect(createPastLog).toHaveBeenCalledOnce();
  await act(async () => finish({ success: false, error: "Tente novamente." }));
  expect(screen.getByRole("alert")).toHaveTextContent("Tente novamente");
  expect(screen.getByLabelText("Atividade")).toHaveValue("Relatório entregue");
  expect(screen.getByLabelText("Horário")).toHaveValue("08:30");
});
it("uma busca atrasada não troca os registros da data recém-selecionada", async () => {
  let finish!: (logs: LogWithTask[]) => void;
  vi.mocked(getLogsForDate).mockImplementation(date => date === "2026-10-26" ? new Promise(resolve => { finish = resolve; }) : Promise.resolve([record("25", "Atividade do dia 25")]));
  render(<Home />);
  fireEvent.click(screen.getByRole("button", { name: "Dia 26" }));
  await waitFor(() => expect(getLogsForDate).toHaveBeenCalledWith("2026-10-26"));
  fireEvent.click(screen.getByRole("button", { name: "Dia 25" }));
  await act(async () => finish([record("26", "Atividade do dia 26")]));
  await waitFor(() => expect(screen.getByTestId("record")).toHaveTextContent("Atividade do dia 25"));
  expect(screen.queryByText("Atividade do dia 26")).not.toBeInTheDocument();
});
it("a página do dia salva repetidamente e ordena a lista pelo horário informado", async () => {
  const existing = record("late", "Almoço", 16);
  vi.mocked(createPastLog).mockResolvedValueOnce({ success: true, log: record("early", "Relatório entregue", 11) });
  render(<LogList initialLogs={[existing]} date="2026-10-26" isPast />);
  fill(); fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(screen.getAllByTestId("record")).toHaveLength(2));
  expect(screen.getAllByTestId("record").map(item => item.textContent)).toEqual(["Relatório entregue", "Almoço"]);
  expect(screen.getByRole("status")).toHaveTextContent("Atividade adicionada");
});
