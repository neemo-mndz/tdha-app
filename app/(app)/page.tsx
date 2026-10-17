import styles from "@/components/home/HomePresentation.module.css";
import { currentWeekStart, getBrazilNow } from '@/lib/utils/date';
import { getWeekStatus } from '@/lib/db/queries/weeks';
import { getUserTasks } from '@/lib/db/queries/tasks';
import { getWeekPlan } from '@/lib/db/queries/weekPlans';
import { getDayLogs } from '@/lib/db/queries/logs';
import { getDayMood } from '@/lib/db/queries/mood';
import { getDayInsight } from '@/lib/db/queries/insights';
import { getUserTags } from '@/lib/db/queries/tags';
import { format } from 'date-fns';
import { getCurrentUserId } from '@/lib/auth';
import { HomeGreetingLive } from '@/components/home/HomeGreetingLive';
import { DailyLogPanel } from '@/components/home/DailyLogPanel';
import { WeeklyTasksPanel } from '@/components/home/WeeklyTasksPanel';
import { HomeCalendarSection } from '@/components/home/HomeCalendarSection';
import { MoodCard } from "@/components/mood/MoodCard";
import { TodayLogsCard } from "@/components/home/TodayLogsCard";
import { DayThoughtsPanel } from "@/components/home/DayThoughtsPanel";
import { getDayThoughts } from "@/lib/db/queries/dayThoughts";
import { LogsProvider } from "@/components/home/LogsProvider";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today = getBrazilNow();
  const weekStart = currentWeekStart(today);

  const userId = await getCurrentUserId();

  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const [days, userTasks, weekPlan, todayLogs, dayMood, allUserTags, todayInsight, todayThoughts] = await Promise.all([
    getWeekStatus(userId, weekStart),
    getUserTasks(userId),
    getWeekPlan(userId, weekStartStr),
    getDayLogs(userId, todayStr),
    getDayMood(userId, todayStr),
    getUserTags(userId),
    getDayInsight(userId, todayStr),
    getDayThoughts(userId, todayStr),
  ]);

  const allTasks = userTasks.map((t) => ({
    id: t.id,
    name: t.name,
    defaultQty: t.defaultQty,
  }));
  const activeTasks = weekPlan?.tasks ?? [];

  return (
    <main className={`shell ${styles.home}`}>
      <LogsProvider initialLogs={todayLogs} todayStr={todayStr}>
        <section className="context-section" aria-label="Sua semana">
          <HomeGreetingLive initialTime={new Date().toISOString()} />
          <HomeCalendarSection weekStart={weekStartStr} days={days} />
        </section>

        <TodayLogsCard allUserTags={allUserTags} />

        <WeeklyTasksPanel
          weekStart={weekStartStr}
          today={todayStr}
          activeTasks={activeTasks}
          allTasks={allTasks}
        />

        <DailyLogPanel activeTasks={activeTasks} weekStart={weekStartStr} />

        <MoodCard date={todayStr} initialMood={dayMood.mood} initialNote={dayMood.moodNote} />
        <DayThoughtsPanel key={todayStr} date={todayStr} initialEntries={todayThoughts} legacyInsight={todayInsight} />
      </LogsProvider>
    </main>
  );
}
