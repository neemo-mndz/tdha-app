import { describe, it, expect } from "vitest";
import {
  updateNameSchema,
  updateAvatarSchema,
  updateBirthDateSchema,
  changePasswordSchema,
  getWeekReportSchema,
} from "../profile.schema";

describe("updateNameSchema", () => {
  it("accepts a valid name", () => {
    const result = updateNameSchema.safeParse({ name: "João Silva" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("João Silva");
    }
  });

  it("trims whitespace before validation", () => {
    const result = updateNameSchema.safeParse({ name: "  Ana  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ana");
    }
  });

  it("rejects name shorter than 2 chars after trim", () => {
    const result = updateNameSchema.safeParse({ name: " a " });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = updateNameSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const result = updateNameSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts name with exactly 2 chars", () => {
    const result = updateNameSchema.safeParse({ name: "AB" });
    expect(result.success).toBe(true);
  });

  it("accepts name with exactly 100 chars", () => {
    const result = updateNameSchema.safeParse({ name: "a".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("rejects name with more than 100 chars", () => {
    const result = updateNameSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("updateAvatarSchema", () => {
  it("accepts a valid data:image/ URL", () => {
    const result = updateAvatarSchema.safeParse({
      avatarUrl: "data:image/jpeg;base64,abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non data:image/ URL", () => {
    const result = updateAvatarSchema.safeParse({
      avatarUrl: "https://example.com/img.png",
    });
    expect(result.success).toBe(false);
  });

  it("rejects avatarUrl exceeding 500_000 chars", () => {
    const result = updateAvatarSchema.safeParse({
      avatarUrl: "data:image/png;base64," + "a".repeat(500_000),
    });
    expect(result.success).toBe(false);
  });

  it("accepts avatarUrl at exactly 500_000 chars", () => {
    const prefix = "data:image/png;base64,";
    const result = updateAvatarSchema.safeParse({
      avatarUrl: prefix + "a".repeat(500_000 - prefix.length),
    });
    expect(result.success).toBe(true);
  });
});

describe("updateBirthDateSchema", () => {
  it("accepts a valid birth date within age range", () => {
    const result = updateBirthDateSchema.safeParse({ birthDate: "2000-06-15" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = updateBirthDateSchema.safeParse({ birthDate: "15/06/2000" });
    expect(result.success).toBe(false);
  });

  it("rejects date that is not a real calendar date", () => {
    const result = updateBirthDateSchema.safeParse({ birthDate: "2000-13-45" });
    expect(result.success).toBe(false);
  });

  it("rejects age younger than 13", () => {
    const now = new Date();
    const tooYoung = `${now.getFullYear() - 10}-01-01`;
    const result = updateBirthDateSchema.safeParse({ birthDate: tooYoung });
    expect(result.success).toBe(false);
  });

  it("rejects age older than 120", () => {
    const result = updateBirthDateSchema.safeParse({ birthDate: "1880-01-01" });
    expect(result.success).toBe(false);
  });

  it("accepts age exactly 13", () => {
    const now = new Date();
    const thirteenYearsAgo = `${now.getFullYear() - 13}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const result = updateBirthDateSchema.safeParse({ birthDate: thirteenYearsAgo });
    expect(result.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("accepts valid passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newpass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects new password shorter than 8 chars", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "current",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects new password longer than 128 chars", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "current",
      newPassword: "a".repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it("accepts new password with exactly 8 chars", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "current",
      newPassword: "a".repeat(8),
    });
    expect(result.success).toBe(true);
  });

  it("accepts new password with exactly 128 chars", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "current",
      newPassword: "a".repeat(128),
    });
    expect(result.success).toBe(true);
  });
});

describe("getWeekReportSchema", () => {
  it("accepts valid array of dates", () => {
    const result = getWeekReportSchema.safeParse({
      dates: ["2024-01-15", "2024-01-16"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = getWeekReportSchema.safeParse({ dates: [] });
    expect(result.success).toBe(false);
  });

  it("rejects array with more than 7 dates", () => {
    const dates = Array.from({ length: 8 }, (_, i) =>
      `2024-01-${String(i + 10).padStart(2, "0")}`
    );
    const result = getWeekReportSchema.safeParse({ dates });
    expect(result.success).toBe(false);
  });

  it("accepts array with exactly 7 dates", () => {
    const dates = Array.from({ length: 7 }, (_, i) =>
      `2024-01-${String(i + 10).padStart(2, "0")}`
    );
    const result = getWeekReportSchema.safeParse({ dates });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format in array", () => {
    const result = getWeekReportSchema.safeParse({
      dates: ["2024-01-15", "invalid"],
    });
    expect(result.success).toBe(false);
  });
});
