import { describe, it, expect } from "vitest";
import { generateFilename } from "../formatters";

describe("generateFilename", () => {
  it("generates filename with user name", () => {
    const result = generateFilename("João Silva", "2024-01-15", "2024-01-21", "pdf");
    expect(result).toBe("semana_joão-silva_15-01-2024_21-01-2024.pdf");
  });

  it("uses 'usuario' fallback when name is null", () => {
    const result = generateFilename(null, "2024-01-15", "2024-01-21", "xlsx");
    expect(result).toBe("semana_usuario_15-01-2024_21-01-2024.xlsx");
  });

  it("uses 'usuario' fallback when name is empty string", () => {
    const result = generateFilename("", "2024-03-01", "2024-03-07", "pdf");
    expect(result).toBe("semana_usuario_01-03-2024_07-03-2024.pdf");
  });

  it("uses 'usuario' fallback when name is whitespace only", () => {
    const result = generateFilename("   ", "2024-06-10", "2024-06-16", "xlsx");
    expect(result).toBe("semana_usuario_10-06-2024_16-06-2024.xlsx");
  });

  it("replaces multiple spaces with single hyphen", () => {
    const result = generateFilename("Ana  Maria  Santos", "2024-02-05", "2024-02-11", "pdf");
    expect(result).toBe("semana_ana-maria-santos_05-02-2024_11-02-2024.pdf");
  });

  it("trims leading and trailing whitespace from name", () => {
    const result = generateFilename("  Carlos  ", "2024-04-01", "2024-04-07", "xlsx");
    expect(result).toBe("semana_carlos_01-04-2024_07-04-2024.xlsx");
  });

  it("handles xlsx extension", () => {
    const result = generateFilename("Maria", "2024-12-30", "2025-01-05", "xlsx");
    expect(result).toBe("semana_maria_30-12-2024_05-01-2025.xlsx");
  });
});
