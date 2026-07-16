import { notFound } from 'next/navigation';
import { z } from 'zod';
import { startOfWeek, parseISO, isValid } from 'date-fns';
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar';
import { getWeekStatus } from '@/lib/db/queries/weeks';

const WeekStartSchema = z
  .string()
  .refine((s) => isValid(parseISO(s)), { message: 'Data inválida' })
  .transform((s) => parseISO(s))
  .refine(
    (d) => startOfWeek(d, { weekStartsOn: 1 }).getTime() === d.getTime(),
    { message: 'A data deve ser uma segunda-feira' },
  );

export default async function WeekPage({
  params,
}: {
  params: Promise<{ weekStart: string }>;
}) {
  const { weekStart } = await params;

  const result = WeekStartSchema.safeParse(weekStart);
  if (!result.success) {
    notFound();
  }

  const weekStartDate = result.data;
  const today = new Date();

  // TODO: Replace hardcoded userId with real auth when available
  const userId = 'user-1';
  const days = await getWeekStatus(userId, weekStartDate);

  return <WeeklyCalendar weekStart={weekStartDate} days={days} today={today} />;
}
