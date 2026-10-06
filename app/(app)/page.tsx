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
    <div className="shell">
      <LogsProvider initialLogs={todayLogs} todayStr={todayStr}>
        {/* CONTEXTO */}
        <div className="context-section">
          <HomeGreetingLive initialTime={today.toISOString()} />
          <div className="context-date">{format(today, "EEEE, d 'de' MMMM")}</div>
          <HomeCalendarSection
            weekStart={weekStartStr}
            days={days}
          />
        </div>

        {/* AGORA / MEU DIA */}
        <div className="now-section">
          <DailyLogPanel activeTasks={activeTasks} />
          <MoodCard
            date={todayStr}
            initialMood={dayMood.mood}
            initialNote={dayMood.moodNote}
          />
          <TodayLogsCard allUserTags={allUserTags} />
        </div>
      </LogsProvider>

      {/* REFLEXÃO */}
      <div className="reflection-section">
        <DayThoughtsPanel key={todayStr} date={todayStr} initialEntries={todayThoughts} legacyInsight={todayInsight} />
      </div>

      {/* ACOMPANHAMENTO */}
      <div className="accompaniment-section">
        <WeeklyTasksPanel
          weekStart={weekStartStr}
          activeTasks={activeTasks}
          allTasks={allTasks}
        />
      </div>
    </div>
  );
}
