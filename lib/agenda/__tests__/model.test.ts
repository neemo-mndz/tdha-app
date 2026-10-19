import { it, expect } from "vitest";
import { agendaWeek, periodForTime } from "../model";
it("navega corretamente nas viradas de mês e ano, com segunda-feira primeiro", () => {
  expect(agendaWeek("2027-01-01")).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
});
it("separa os limites entre manhã, tarde e noite", () => {
  expect(["00:00", "11:59", "12:00", "17:59", "18:00", "23:59"].map(periodForTime)).toEqual(["morning", "morning", "afternoon", "afternoon", "evening", "evening"]);
});
