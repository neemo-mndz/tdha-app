import { format, getDaysInMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type TimePeriod = 'morning' | 'afternoon' | 'evening';

/** Returns greeting text based on hour (0-23) */
export function getGreetingText(hour: number): 'Bom dia' | 'Boa tarde' | 'Boa noite' {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Returns formatted date string: "segunda-feira, 7 de julho" */
export function formatGreetingDate(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

/** Returns badge text: "faltam N dias no mês" or "último dia do mês" */
export function getBadgeText(date: Date): string {
  const dayOfMonth = getDate(date);
  const totalDays = getDaysInMonth(date);
  const daysLeft = totalDays - dayOfMonth;

  if (daysLeft === 0) return 'último dia do mês';
  return `faltam ${daysLeft} dias no mês`;
}

/** Returns the period key for a given hour */
export function getTimePeriod(hour: number): TimePeriod {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
