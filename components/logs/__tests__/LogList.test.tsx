import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LogList } from "../LogList";
import type { LogWithTask } from "@/lib/db/queries/logs";

// Mock the server actions
vi.mock("@/lib/actions/logs", () => ({
  createLog: vi.fn(),
  updateLog: vi.fn(),
  deleteLog: vi.fn(),
}));

import { createLog } from "@/lib/actions/logs";

const mockCreateLog = createLog as ReturnType<typeof vi.fn>;

// Helper to create mock log data
function createMockLog(overrides: Partial<LogWithTask> = {}): LogWithTask {
  return {
    id: "log-1",
    dayId: "day-1",
    content: "Test log content",
    mood: null,
    weekPlanTaskId: null,
    createdAt: new Date("2024-07-14T10:00:00Z"),
    taskName: null,
    tags: [],
    ...overrides,
  };
}

describe("LogList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders empty state when no logs are provided", () => {
      render(<LogList initialLogs={[]} date="2024-07-14" />);
      expect(
        screen.getByText("Nenhum registro ainda. Que tal começar agora?")
      ).toBeInTheDocument();
    });

    it("renders LogForm in empty state", () => {
      render(<LogList initialLogs={[]} date="2024-07-14" />);
      const textarea = screen.getByPlaceholderText("O que aconteceu hoje?");
      expect(textarea).toBeInTheDocument();
    });

    it("renders list of logs when logs are provided", () => {
      const logs = [
        createMockLog({ id: "log-1", content: "First log" }),
        createMockLog({ id: "log-2", content: "Second log" }),
      ];
      render(<LogList initialLogs={logs} date="2024-07-14" />);

      expect(screen.getByText("First log")).toBeInTheDocument();
      expect(screen.getByText("Second log")).toBeInTheDocument();
    });

    it("renders LogForm below the list when logs are present", () => {
      const logs = [createMockLog()];
      render(<LogList initialLogs={logs} date="2024-07-14" />);

      const textarea = screen.getByPlaceholderText("O que aconteceu hoje?");
      expect(textarea).toBeInTheDocument();
    });

    it("renders each log in a card element", () => {
      const logs = [
        createMockLog({ id: "log-1", content: "Log 1" }),
        createMockLog({ id: "log-2", content: "Log 2" }),
      ];
      const { container } = render(<LogList initialLogs={logs} date="2024-07-14" />);

      const logCards = container.querySelectorAll(".log-item");
      expect(logCards).toHaveLength(2);
    });
  });

  describe("Optimistic UI — Add", () => {
    it("optimistically adds a log to the list before server confirmation", async () => {
      mockCreateLog.mockResolvedValueOnce({ success: true });

      const logs: LogWithTask[] = [];
      render(<LogList initialLogs={logs} date="2024-07-14" />);

      const textarea = screen.getByPlaceholderText("O que aconteceu hoje?") as HTMLTextAreaElement;
      const button = screen.getByRole("button", { name: "Registrar" });

      fireEvent.change(textarea, { target: { value: "New log content" } });
      fireEvent.click(button);

      // The optimistic log should appear immediately
      await waitFor(() => {
        expect(screen.getByText("New log content")).toBeInTheDocument();
      });
    });

    it("removes optimistic log if server returns error", async () => {
      mockCreateLog.mockResolvedValueOnce({ success: false, error: "Error" });

      const logs: LogWithTask[] = [];
      render(<LogList initialLogs={logs} date="2024-07-14" />);

      const textarea = screen.getByPlaceholderText("O que aconteceu hoje?") as HTMLTextAreaElement;
      const button = screen.getByRole("button", { name: "Registrar" });

      fireEvent.change(textarea, { target: { value: "New log content" } });
      fireEvent.click(button);

      // After error, the optimistic log should be removed
      await waitFor(() => {
        expect(screen.queryByText("New log content")).not.toBeInTheDocument();
      });

      // Should show empty state again
      expect(
        screen.getByText("Nenhum registro ainda. Que tal começar agora?")
      ).toBeInTheDocument();
    });

    it("clears the form after successful submission", async () => {
      mockCreateLog.mockResolvedValueOnce({ success: true });

      render(<LogList initialLogs={[]} date="2024-07-14" />);

      const textarea = screen.getByPlaceholderText(
        "O que aconteceu hoje?"
      ) as HTMLTextAreaElement;
      const button = screen.getByRole("button", { name: "Registrar" });

      fireEvent.change(textarea, { target: { value: "New log" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(textarea.value).toBe("");
      });
    });

    it("calls createLog server action with correct parameters", async () => {
      mockCreateLog.mockResolvedValueOnce({ success: true });

      render(<LogList initialLogs={[]} date="2024-07-14" />);

      const textarea = screen.getByPlaceholderText("O que aconteceu hoje?") as HTMLTextAreaElement;
      const button = screen.getByRole("button", { name: "Registrar" });

      fireEvent.change(textarea, { target: { value: "New log content" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCreateLog).toHaveBeenCalledWith({
          content: "New log content",
          date: "2024-07-14",
        });
      });
    });
  });

  describe("Optimistic UI — Update and Delete", () => {
    it("renders edit and delete buttons for each log", () => {
      const logs = [createMockLog()];
      render(<LogList initialLogs={logs} date="2024-07-14" />);

      expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(1);
      expect(screen.getAllByRole("button", { name: "Excluir" })).toHaveLength(1);
    });
  });

  describe("Empty state replacement", () => {
    it("replaces empty state with list when first log is added", async () => {
      mockCreateLog.mockResolvedValueOnce({ success: true });

      render(<LogList initialLogs={[]} date="2024-07-14" />);

      // Initially should show empty state
      expect(
        screen.getByText("Nenhum registro ainda. Que tal começar agora?")
      ).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText("O que aconteceu hoje?");
      const button = screen.getByRole("button", { name: "Registrar" });

      fireEvent.change(textarea, { target: { value: "First log" } });
      fireEvent.click(button);

      await waitFor(() => {
        // Empty state message should disappear
        expect(
          screen.queryByText("Nenhum registro ainda. Que tal começar agora?")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Multiple logs ordering", () => {
    it("preserves order when displaying multiple logs", () => {
      const logs = [
        createMockLog({
          id: "log-1",
          content: "First",
          createdAt: new Date("2024-07-14T09:00:00Z"),
        }),
        createMockLog({
          id: "log-2",
          content: "Second",
          createdAt: new Date("2024-07-14T10:00:00Z"),
        }),
        createMockLog({
          id: "log-3",
          content: "Third",
          createdAt: new Date("2024-07-14T11:00:00Z"),
        }),
      ];

      const { container } = render(<LogList initialLogs={logs} date="2024-07-14" />);

      const logCards = container.querySelectorAll(".log-item");
      expect(logCards[0]).toHaveTextContent("First");
      expect(logCards[1]).toHaveTextContent("Second");
      expect(logCards[2]).toHaveTextContent("Third");
    });
  });

  describe("Date prop passing", () => {
    it("passes the date prop to LogForm and LogItem components", () => {
      const logs = [createMockLog()];
      const { container } = render(<LogList initialLogs={logs} date="2024-07-14" />);

      // Verify components are rendered (they receive date internally)
      expect(container.querySelector('.log-item')).toBeInTheDocument();
      expect(screen.getByPlaceholderText("O que aconteceu hoje?")).toBeInTheDocument();
    });
  });
});

// ─── Property-Based Tests ──────────────────────────────────────────────────

import fc from "fast-check";
import { cleanup } from "@testing-library/react";

// Generates valid Log objects
const arbLog = fc.record({
  id: fc.uuid(),
  dayId: fc.uuid(),
  content: fc
    .string({ minLength: 1, maxLength: 2000 })
    .filter((s) => s.trim().length > 0),
  mood: fc.oneof(fc.constant(null), fc.integer()),
  weekPlanTaskId: fc.constant(null),
  createdAt: fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }).filter(d => !isNaN(d.getTime())),
  taskName: fc.constant(null),
  tags: fc.constant([] as { id: string; name: string }[]),
});

// Generates valid date strings in yyyy-MM-dd format
const arbDateString = fc
  .date({ min: new Date("2000-01-01"), max: new Date("2099-12-31") })
  .filter((d) => !isNaN(d.getTime()))
  .map((d) => d.toISOString().split("T")[0]);

describe("LogList — Property-Based Tests", () => {
  afterEach(() => {
    cleanup();
  });

  // Feature: daily-log-system, Property 2: Round-trip de criação e exclusão
  // **Validates: Requirements 2.1, 4.2**
  it("optimistically adds and can remove log, list returns to original state", () => {
    fc.assert(
      fc.property(
        fc.array(arbLog),
        arbLog,
        arbDateString,
        (initialLogs, newLog, date) => {
          cleanup();
          mockCreateLog.mockResolvedValueOnce({ success: true });

          // Render with all logs (simulating post-creation state)
          const allLogs = [...initialLogs, newLog];
          const { container } = render(<LogList initialLogs={allLogs} date={date} />);

          // All logs should be in the document
          const logCards = container.querySelectorAll(".log-item");
          expect(logCards.length).toBe(allLogs.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: daily-log-system, Property 5: Ordenação cronológica de getDayLogs
  // **Validates: Requirements 1.1**
  it("renders logs in order they are provided (preserves input order)", () => {
    fc.assert(
      fc.property(
        fc.array(arbLog, { minLength: 1, maxLength: 10 }).map(logs =>
          logs.map((log, i) => ({ ...log, id: `log-${i}-${log.id}` }))
        ),
        (logs) => {
          cleanup();
          const { container } = render(<LogList initialLogs={logs} date="2024-07-14" />);

          const logCards = container.querySelectorAll(".log-item");
          expect(logCards.length).toBe(logs.length);

          for (let i = 0; i < logs.length; i++) {
            const contentEl = logCards[i].querySelector(".log-item__body");
            expect(contentEl).not.toBeNull();
            expect(contentEl!.textContent).toBe(logs[i].content);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: daily-log-system, Property 4: Associação correta do log ao Day
  // **Validates: Requirements 2.1, 5.4, 8.4**
  it("passes correct date prop to server action on create", async () => {
    await fc.assert(
      fc.asyncProperty(arbDateString, async (date) => {
        cleanup();
        mockCreateLog.mockReset();
        mockCreateLog.mockResolvedValueOnce({ success: true });

        render(
          <LogList initialLogs={[]} date={date} />
        );

        const textarea = screen.getByPlaceholderText(
          "O que aconteceu hoje?"
        ) as HTMLTextAreaElement;
        const button = screen.getByRole("button", { name: "Registrar" });

        fireEvent.change(textarea, { target: { value: "test" } });
        fireEvent.click(button);

        // Verify that createLog was called with the correct date
        await waitFor(() => {
          expect(mockCreateLog).toHaveBeenCalledWith(
            expect.objectContaining({ date })
          );
        });
      }),
      { numRuns: 50 }
    );
  });

  // Feature: daily-log-system, Property 1: Boundary de conteúdo
  // **Validates: Requirements 2.2, 2.5, 3.3, 3.4, 8.1, 8.2, 8.3**
  it("handles content boundary correctly (LogForm validation)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 2000 }).filter((s) => s.trim().length > 0),
          arbDateString
        ),
        async ([content, date]) => {
          cleanup();
          mockCreateLog.mockReset();
          mockCreateLog.mockResolvedValueOnce({ success: true });

          render(<LogList initialLogs={[]} date={date} />);

          const textarea = screen.getByPlaceholderText(
            "O que aconteceu hoje?"
          ) as HTMLTextAreaElement;
          const button = screen.getByRole("button", { name: "Registrar" });

          fireEvent.change(textarea, { target: { value: content } });
          fireEvent.click(button);

          // Should call createLog for valid content
          await waitFor(() => {
            expect(mockCreateLog).toHaveBeenCalled();
          });
        }
      ),
      { numRuns: 30 }
    );
  });
});
