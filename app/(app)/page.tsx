import { currentWeekStart } from '@/lib/utils/date';
import { getWeekStatus } from '@/lib/db/queries/weeks';
import { getUserTasks } from '@/lib/db/queries/tasks';
import { getWeekPlan } from '@/lib/db/queries/weekPlans';
import { getDayLogs } from '@/lib/db/queries/logs';
import { format } from 'date-fns';
import { getCurrentUserId } from '@/lib/auth';
import { HomeGreetingLive } from '@/components/home/HomeGreetingLive';
import { DailyLogPanel } from '@/components/home/DailyLogPanel';
import { WeeklyTasksPanel } from '@/components/home/WeeklyTasksPanel';
import { HomeCalendarSection } from '@/components/home/HomeCalendarSection';

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
      <HomeGreetingLive initialTime={today.toISOString()} />

      <HomeCalendarSection
        weekStart={weekStartStr}
        days={days}
        today={todayStr}
        initialLogs={todayLogs}
      />

      <div className="stack">
        <DailyLogPanel date={todayStr} activeTasks={activeTasks} />
        <WeeklyTasksPanel
          weekStart={weekStartStr}
          activeTasks={activeTasks}
          allTasks={allTasks}
        />
      </div>
    </div>
  );
}
