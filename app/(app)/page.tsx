import { currentWeekStart } from '@/lib/utils/date';
import { getWeekStatus } from '@/lib/db/queries/weeks';
import WeeklyCalendar from '@/components/calendar/WeeklyCalendar';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today = new Date();
  const weekStart = currentWeekStart(today);

  // TODO: substituir por userId real quando auth estiver implementado
  const userId = '00000000-0000-0000-0000-000000000001';

  const days = await getWeekStatus(userId, weekStart);

  return <WeeklyCalendar weekStart={weekStart} days={days} today={today} />;
}
