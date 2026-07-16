import Link from 'next/link';
import { currentWeekStart } from '@/lib/utils/date';
import { getWeekStatus } from '@/lib/db/queries/weeks';
import { getUserTasks } from '@/lib/db/queries/tasks';
import { getWeekPlan } from '@/lib/db/queries/weekPlans';
import { getDayLogs } from '@/lib/db/queries/logs';
import { getCurrentUserId } from '@/lib/auth';
import WeeklyCalendar from '@/components/calendar/WeeklyCalendar';
import { format } from 'date-fns';
import { HomeGreeting, MonthBadge } from '@/components/home/HomeGreeting';
import { DailyLogPanel } from '@/components/home/DailyLogPanel';
import { WeeklyTasksPanel } from '@/components/home/WeeklyTasksPanel';
import { CalendarToggle } from '@/components/home/CalendarToggle';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today = new Date();
  const weekStart = currentWeekStart(today);

  const userId = await getCurrentUserId();

  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const [days, userTasks, weekPlan, todayLogs] = await Promise.all([
    getWeekStatus(userId, weekStart),
    getUserTasks(userId),
    getWeekPlan(userId, weekStartStr),
    getDayLogs(userId, todayStr),
  ]);

  const allTasks = userTasks.map((t) => ({
    id: t.id,
    name: t.name,
    defaultQty: t.defaultQty,
  }));
  const activeTasks = weekPlan?.tasks ?? [];

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">semana<span>.</span></div>
        <div className="top__right">
          <Link href="/settings/reminders" className="top__settings-link" aria-label="Lembretes">
            ⚙
          </Link>
          <MonthBadge today={today} />
        </div>
      </header>

      <HomeGreeting today={today} />

      <CalendarToggle>
        <WeeklyCalendar weekStart={weekStart} days={days} today={today} />
      </CalendarToggle>

      <div className="panels">
        <DailyLogPanel date={todayStr} activeTasks={activeTasks} initialLogs={todayLogs} />
        <WeeklyTasksPanel
          weekStart={weekStartStr}
          activeTasks={activeTasks}
          allTasks={allTasks}
        />
      </div>
    </div>
  );
}
