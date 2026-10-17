import { addDays, format, parseISO, isValid } from "date-fns";
import type { ActiveTaskDisplay } from "@/lib/types/tasks";

export function isDateInWeek(date: string, weekStart: string): boolean {
  const start = parseISO(weekStart);
  return isValid(start) && date >= weekStart && date <= format(addDays(start, 6), "yyyy-MM-dd");
}

/** Product dates use the same Brazilian civil day on server and client. */
export function rhythmToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export type RhythmAction =
  | { type: "toggleDay"; weekPlanTaskId: string; date: string }
  | { type: "bump"; weekPlanTaskId: string; today?: string };

export function rhythmReducer(state: ActiveTaskDisplay[], action: RhythmAction): ActiveTaskDisplay[] {
  return state.map((task) => {
    if (task.weekPlanTaskId !== action.weekPlanTaskId) return task;
    const date = action.type === "toggleDay" ? action.date : action.today;
    const exists = date ? task.completedDates.includes(date) : false;
    const removing = action.type === "toggleDay" && exists;
    const completedDates = removing
      ? task.completedDates.filter((d) => d !== date)
      : date && !exists ? [...task.completedDates, date] : task.completedDates;
    return { ...task, completedDates, done: Math.max(completedDates.length, task.done + (removing ? -1 : 1)) };
  });
}
