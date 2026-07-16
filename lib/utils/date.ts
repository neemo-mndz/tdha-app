import {
  startOfWeek,
  addDays,
  format,
  isSameWeek,
  isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Início da semana fixado como segunda-feira (não configurável no MVP) */
export const WEEK_START_DAY = 1 as const; // 0=domingo, 1=segunda

/** Retorna a segunda-feira 00:00 da semana de `from` */
export function currentWeekStart(from: Date = new Date()): Date {
  return startOfWeek(from, { weekStartsOn: WEEK_START_DAY });
}

/** Formata weekStart como parâmetro de rota: "2025-06-30" */
export function formatWeekParam(weekStart: Date): string {
  return format(weekStart, 'yyyy-MM-dd');
}

/** Formata data do dia como parâmetro de rota: "2025-07-02" */
export function formatDateParam(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Rota para uma semana: "/week/2025-06-30" (ou "/" para a atual) */
export function weekPath(weekStart: Date): string {
  const now = currentWeekStart();
  if (isSameDay(weekStart, now)) return '/';
  return `/week/${formatWeekParam(weekStart)}`;
}

/** Verifica se uma data é o dia atual */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Verifica se uma data pertence à semana atual */
export function isCurrentWeek(date: Date): boolean {
  return isSameWeek(date, new Date(), { weekStartsOn: WEEK_START_DAY });
}

/** Label legível da semana: "30 jun – 6 jul · 2025" */
export function weekLabel(weekStart: Date, locale = ptBR): string {
  const weekEnd = addDays(weekStart, 6);
  const start = format(weekStart, 'd MMM', { locale });
  const end = format(weekEnd, 'd MMM', { locale });
  const year = format(weekEnd, 'yyyy');
  return `${start} – ${end} · ${year}`;
}
