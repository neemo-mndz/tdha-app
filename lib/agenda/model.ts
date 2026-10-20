import { addDays, format, parseISO, startOfWeek } from "date-fns";

export const AGENDA_TAGS = ["trabalho", "casal", "pessoal", "psicologa"] as const;
export type AgendaTag = typeof AGENDA_TAGS[number];
export const TAG_LABELS: Record<AgendaTag, string> = { trabalho: "Trabalho", casal: "Casal", pessoal: "Pessoal", psicologa: "Psicóloga" };
export const PERIODS = ["anytime", "morning", "afternoon", "evening"] as const;
export type AgendaPeriod = typeof PERIODS[number];
export const PERIOD_LABELS: Record<AgendaPeriod, string> = { anytime: "Sem horário definido", morning: "Manhã", afternoon: "Tarde", evening: "Noite" };

export interface AgendaEntry {
  id: string;
  date: string;
  title: string;
  notes: string;
  tags: AgendaTag[];
  period: AgendaPeriod;
  startTime: string | null;
  endTime: string | null;
  completed: boolean;
}

export function periodForTime(time: string): AgendaPeriod {
  const hour = Number(time.slice(0, 2));
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}
export function agendaWeek(date: string) {
  const start = startOfWeek(parseISO(date), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => format(addDays(start, index), "yyyy-MM-dd"));
}
export function agendaPath(date: string, view = "day", tag = "all") {
  return `/agenda?${new URLSearchParams({ date, view, tag })}`;
}
export function sortAgenda(entries: AgendaEntry[]) {
  return [...entries].sort((a, b) => Number(a.completed) - Number(b.completed)
    || (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") || a.title.localeCompare(b.title, "pt-BR"));
}
