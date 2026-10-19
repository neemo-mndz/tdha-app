import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { QuickCaptureSheet } from "../QuickCaptureSheet";
import { createLog } from "@/lib/actions/logs";
vi.mock("@/lib/actions/logs", () => ({ createLog: vi.fn() }));
vi.mock("../TaskChips", () => ({ TaskChips: () => null }));

beforeEach(() => vi.clearAllMocks());
describe("registro rápido pelo widget", () => {
  it("mantém o texto e permite tentar novamente quando a rede falha", async () => {
    vi.mocked(createLog).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ success: true });
    const close = vi.fn();
    render(<QuickCaptureSheet open onClose={close} date="2026-10-19" activeTasks={[]} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Fui caminhar" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Seu texto foi mantido");
    expect(input).toHaveValue("Fui caminhar");
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(createLog).toHaveBeenLastCalledWith({ content: "Fui caminhar", date: "2026-10-19", weekPlanTaskId: null });
  });
  it("bloqueia novo envio e fechamento enquanto salva", async () => {
    let finish!: (value: { success: true }) => void;
    vi.mocked(createLog).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const close = vi.fn();
    render(<QuickCaptureSheet open onClose={close} date="2026-10-19" activeTasks={[]} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Almocei" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    fireEvent.submit(screen.getByRole("textbox").closest("form")!);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(createLog).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
    finish({ success: true });
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });
});
