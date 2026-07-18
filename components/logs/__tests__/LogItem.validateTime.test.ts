import { describe, it, expect } from "vitest";
import { validateTime } from "../LogItem";

describe("validateTime", () => {
  describe("valid times", () => {
    it("accepts 00:00", () => {
      expect(validateTime("00:00")).toBeNull();
    });

    it("accepts 12:30", () => {
      expect(validateTime("12:30")).toBeNull();
    });

    it("accepts 23:59", () => {
      expect(validateTime("23:59")).toBeNull();
    });

    it("accepts 09:05", () => {
      expect(validateTime("09:05")).toBeNull();
    });
  });

  describe("empty / whitespace", () => {
    it("rejects empty string", () => {
      expect(validateTime("")).toBe("O horário é obrigatório");
    });

    it("rejects whitespace-only string", () => {
      expect(validateTime("   ")).toBe("O horário é obrigatório");
    });
  });

  describe("invalid format", () => {
    it("rejects single digit hour", () => {
      expect(validateTime("1:30")).toBe("Formato esperado: HH:mm");
    });

    it("rejects single digit minute", () => {
      expect(validateTime("01:5")).toBe("Formato esperado: HH:mm");
    });

    it("rejects letters", () => {
      expect(validateTime("ab:cd")).toBe("Formato esperado: HH:mm");
    });

    it("rejects missing colon", () => {
      expect(validateTime("1230")).toBe("Formato esperado: HH:mm");
    });

    it("rejects extra characters", () => {
      expect(validateTime("12:30:00")).toBe("Formato esperado: HH:mm");
    });
  });

  describe("out of range", () => {
    it("rejects hour 24", () => {
      expect(validateTime("24:00")).toBe("Horário inválido. Horas: 00-23, Minutos: 00-59");
    });

    it("rejects hour 25", () => {
      expect(validateTime("25:00")).toBe("Horário inválido. Horas: 00-23, Minutos: 00-59");
    });

    it("rejects minute 60", () => {
      expect(validateTime("12:60")).toBe("Horário inválido. Horas: 00-23, Minutos: 00-59");
    });

    it("rejects minute 99", () => {
      expect(validateTime("12:99")).toBe("Horário inválido. Horas: 00-23, Minutos: 00-59");
    });
  });
});
