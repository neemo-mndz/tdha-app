import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMood, saveMoodNote } from "@/lib/actions/mood";

/**
 * Feature: mood-tracking
 * Tests for Server Actions: saveMood, saveMoodNote
 *
 * These tests verify the full server action flow with mocked dependencies:
 * - Zod validation
 * - Authentication via getCurrentUserId
 * - DB persistence via upsertDay + updateDayMood / updateDayMoodNote
 * - Path revalidation
 *
 * **Validates: Requirements 2.1, 2.2, 3.5, 3.6, 4.6, 4.7**
 */

// --- Mocks ---

const mockGetCurrentUserId = vi.fn();
vi.mock("@/lib/auth", () => ({
  getCurrentUserId: () => mockGetCurrentUserId(),
}));

const mockUpsertDay = vi.fn();
vi.mock("@/lib/db/queries/logs", () => ({
  upsertDay: (...args: unknown[]) => mockUpsertDay(...args),
}));

const mockUpdateDayMood = vi.fn();
const mockUpdateDayMoodNote = vi.fn();
vi.mock("@/lib/db/queries/mood", () => ({
  updateDayMood: (...args: unknown[]) => mockUpdateDayMood(...args),
  updateDayMoodNote: (...args: unknown[]) => mockUpdateDayMoodNote(...args),
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// --- Test constants ---

const TEST_USER_ID = "user-uuid-123";
const TEST_DAY_ID = "day-uuid-456";
const TEST_DATE = "2024-07-14";

describe("Server Actions — mood", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUserId.mockResolvedValue(TEST_USER_ID);
    mockUpsertDay.mockResolvedValue({ id: TEST_DAY_ID });
    mockUpdateDayMood.mockResolvedValue(undefined);
    mockUpdateDayMoodNote.mockResolvedValue(undefined);
  });

  // --- saveMood ---

  describe("saveMood", () => {
    it("persiste mood válido e retorna sucesso", async () => {
      const result = await saveMood({ date: TEST_DATE, mood: "good" });

      expect(result).toEqual({ success: true });
      expect(mockGetCurrentUserId).toHaveBeenCalledOnce();
      expect(mockUpsertDay).toHaveBeenCalledWith(TEST_USER_ID, TEST_DATE);
      expect(mockUpdateDayMood).toHaveBeenCalledWith(TEST_DAY_ID, "good");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    });

    it("com mood=null limpa o humor do dia", async () => {
      const result = await saveMood({ date: TEST_DATE, mood: null });

      expect(result).toEqual({ success: true });
      expect(mockUpdateDayMood).toHaveBeenCalledWith(TEST_DAY_ID, null);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    });

    it("rejeita mood inválido (string fora do enum)", async () => {
      const result = await saveMood({ date: TEST_DATE, mood: "happy" });

      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
      // Should not reach DB layer
      expect(mockGetCurrentUserId).not.toHaveBeenCalled();
      expect(mockUpsertDay).not.toHaveBeenCalled();
      expect(mockUpdateDayMood).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("rejeita data com formato inválido", async () => {
      const result = await saveMood({ date: "14/07/2024", mood: "good" });

      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
      expect(mockUpsertDay).not.toHaveBeenCalled();
    });

    it("retorna erro genérico quando DB falha", async () => {
      mockUpsertDay.mockRejectedValue(new Error("DB error"));

      const result = await saveMood({ date: TEST_DATE, mood: "neutral" });

      expect(result).toEqual({
        success: false,
        error: "Não foi possível salvar. Tente novamente.",
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("aceita todos os 5 valores válidos de MoodValue", async () => {
      const validMoods = ["great", "good", "neutral", "bad", "awful"] as const;

      for (const mood of validMoods) {
        vi.clearAllMocks();
        mockGetCurrentUserId.mockResolvedValue(TEST_USER_ID);
        mockUpsertDay.mockResolvedValue({ id: TEST_DAY_ID });
        mockUpdateDayMood.mockResolvedValue(undefined);

        const result = await saveMood({ date: TEST_DATE, mood });
        expect(result).toEqual({ success: true });
        expect(mockUpdateDayMood).toHaveBeenCalledWith(TEST_DAY_ID, mood);
      }
    });
  });

  // --- saveMoodNote ---

  describe("saveMoodNote", () => {
    it("persiste nota válida", async () => {
      const result = await saveMoodNote({
        date: TEST_DATE,
        note: "Dia produtivo",
      });

      expect(result).toEqual({ success: true });
      expect(mockGetCurrentUserId).toHaveBeenCalledOnce();
      expect(mockUpsertDay).toHaveBeenCalledWith(TEST_USER_ID, TEST_DATE);
      expect(mockUpdateDayMoodNote).toHaveBeenCalledWith(
        TEST_DAY_ID,
        "Dia produtivo"
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    });

    it("com whitespace-only persiste null", async () => {
      const result = await saveMoodNote({ date: TEST_DATE, note: "   \t\n  " });

      expect(result).toEqual({ success: true });
      expect(mockUpdateDayMoodNote).toHaveBeenCalledWith(TEST_DAY_ID, null);
    });

    it("com nota null persiste null", async () => {
      const result = await saveMoodNote({ date: TEST_DATE, note: null });

      expect(result).toEqual({ success: true });
      expect(mockUpdateDayMoodNote).toHaveBeenCalledWith(TEST_DAY_ID, null);
    });

    it("trim na nota antes de persistir", async () => {
      const result = await saveMoodNote({
        date: TEST_DATE,
        note: "  Cansado  ",
      });

      expect(result).toEqual({ success: true });
      expect(mockUpdateDayMoodNote).toHaveBeenCalledWith(
        TEST_DAY_ID,
        "Cansado"
      );
    });

    it("rejeita nota com mais de 80 caracteres", async () => {
      const result = await saveMoodNote({
        date: TEST_DATE,
        note: "a".repeat(81),
      });

      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
      expect(mockUpsertDay).not.toHaveBeenCalled();
    });

    it("aceita nota com exatamente 80 caracteres", async () => {
      const note = "a".repeat(80);
      const result = await saveMoodNote({ date: TEST_DATE, note });

      expect(result).toEqual({ success: true });
      expect(mockUpdateDayMoodNote).toHaveBeenCalledWith(TEST_DAY_ID, note);
    });

    it("retorna erro genérico quando DB falha", async () => {
      mockUpdateDayMoodNote.mockRejectedValue(new Error("DB error"));

      const result = await saveMoodNote({
        date: TEST_DATE,
        note: "Ansioso",
      });

      expect(result).toEqual({
        success: false,
        error: "Não foi possível salvar. Tente novamente.",
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("rejeita data com formato inválido", async () => {
      const result = await saveMoodNote({
        date: "not-a-date",
        note: "Boa",
      });

      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
      expect(mockUpsertDay).not.toHaveBeenCalled();
    });
  });
});
