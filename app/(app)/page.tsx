import { currentWeekStart } from '@/lib/utils/date';
import { getWeekStatus } from '@/lib/db/queries/weeks';
import WeeklyCalendar from '@/components/calendar/WeeklyCalendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HomeGreeting } from '@/components/home/HomeGreeting';
import { DailyLogPanel } from '@/components/home/DailyLogPanel';
import { WeeklyTasksPanel } from '@/components/home/WeeklyTasksPanel';
import { CalendarToggle } from '@/components/home/CalendarToggle';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today = new Date();
  const weekStart = currentWeekStart(today);

  // TODO: substituir por userId real quando auth estiver implementado
  const userId = '00000000-0000-0000-0000-000000000001';

  const days = await getWeekStatus(userId, weekStart);
  const todayStr = format(today, 'yyyy-MM-dd');

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">semana<span>.</span></div>
      </header>

      <HomeGreeting today={today} />

      <CalendarToggle>
        <WeeklyCalendar weekStart={weekStart} days={days} today={today} />
      </CalendarToggle>

      <div className="panels">
        <DailyLogPanel date={todayStr} />
        <WeeklyTasksPanel />
      </div>
    </div>
  );
}
