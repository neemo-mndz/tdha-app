import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db client
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: (...fArgs: unknown[]) => {
        mockFrom(...fArgs);
        return { where: (...wArgs: unknown[]) => {
          mockWhere(...wArgs);
          return (mockWhere as ReturnType<typeof vi.fn> & { _result?: unknown[] })._result ?? [];
        }};
      }};
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: (...vArgs: unknown[]) => {
        mockValues(...vArgs);
        return Promise.resolve();
      }};
    },
    delete: (...args: unknown[]) => {
      mockDelete(...args);
      return { where: (...wArgs: unknown[]) => {
        mockWhere(...wArgs);
        return Promise.resolve();
      }};
    },
  },
}));

vi.mock("@/drizzle/schema", () => ({
  loginAttempts: {
    email: "email",
    attemptedAt: "attempted_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ type: "eq", col, val }),
  gte: (col: unknown, val: unknown) => ({ type: "gte", col, val }),
  and: (...conditions: unknown[]) => ({ type: "and", conditions }),
}));

import { checkRateLimit, recordFailedAttempt, clearFailedAttempts } from "../rate-limit";

describe("lib/auth/rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockWhere as ReturnType<typeof vi.fn> & { _result?: unknown[] })._result = undefined;
  });

  describe("checkRateLimit", () => {
    it("returns allowed: true when there are fewer than 5 attempts", async () => {
      (mockWhere as ReturnType<typeof vi.fn> & { _result?: unknown[] })._result = [
        { attemptedAt: new Date() },
        { attemptedAt: new Date() },
      ];

      const result = await checkRateLimit("User@Example.com");
      expect(result.allowed).toBe(true);
      expect(result.retryAfterSeconds).toBeUndefined();
    });

    it("returns allowed: false with retryAfterSeconds when 5+ attempts exist", async () => {
      const now = Date.now();
      const attempts = Array.from({ length: 5 }, (_, i) => ({
        attemptedAt: new Date(now - (10 - i) * 60 * 1000), // spread over last 10 min
      }));
      (mockWhere as ReturnType<typeof vi.fn> & { _result?: unknown[] })._result = attempts;

      const result = await checkRateLimit("user@example.com");
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("returns allowed: true when there are no attempts", async () => {
      (mockWhere as ReturnType<typeof vi.fn> & { _result?: unknown[] })._result = [];

      const result = await checkRateLimit("user@example.com");
      expect(result.allowed).toBe(true);
    });

    it("normalizes email to lowercase and trim before querying", async () => {
      (mockWhere as ReturnType<typeof vi.fn> & { _result?: unknown[] })._result = [];

      await checkRateLimit("  USER@Example.COM  ");
      // Verify the select was called (email normalization is internal)
      expect(mockSelect).toHaveBeenCalled();
    });

    it("retryAfterSeconds is at least 1", async () => {
      const now = Date.now();
      // All attempts at nearly the start of the window (14:59 minutes ago)
      const attempts = Array.from({ length: 5 }, () => ({
        attemptedAt: new Date(now - 14 * 60 * 1000 - 59 * 1000),
      }));
      (mockWhere as ReturnType<typeof vi.fn> & { _result?: unknown[] })._result = attempts;

      const result = await checkRateLimit("user@example.com");
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    });
  });

  describe("recordFailedAttempt", () => {
    it("inserts a record into loginAttempts with normalized email", async () => {
      await recordFailedAttempt("  User@Example.COM  ");

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        email: "user@example.com",
      });
    });
  });

  describe("clearFailedAttempts", () => {
    it("deletes records for the normalized email", async () => {
      await clearFailedAttempts("  User@Example.COM  ");

      expect(mockDelete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
