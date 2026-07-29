import { notFound } from 'next/navigation';
import { z } from 'zod';
import { startOfWeek, parseISO, isValid, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar';
import { getWeekStatus } from '@/lib/db/queries/weeks';
import { getUserTasks } from '@/lib/db/queries/tasks';
import { getWeekPlan } from '@/lib/db/queries/weekPlans';
import { getDayLogs } from '@/lib/db/queries/logs';
import { getCurrentUserId } from '@/lib/auth';
import { currentWeekStart } from '@/lib/utils/date';
import { HomeGreetingLive } from '@/components/home/HomeGreetingLive';
import { DailyLogPanel } from '@/components/home/DailyLogPanel';
import { WeeklyTasksPanel } from '@/components/home/WeeklyTasksPanel';
import { HomeCalendarSection } from '@/components/home/HomeCalendarSection';
import { LogsProvider } from '@/components/home/LogsProvider';
import { getUserTags } from '@/lib/db/queries/tags';

export const dynamic = 'force-dynamic';

const WeekStartSchema = z
  .string()
  .refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && isValid(parseISO(s)), { message: 'Data inválida' })
  .transform((s) => {
    // Parse as local date to avoid timezone issues (parseISO("2025-06-30") creates midnight local)
    const [year, month, day] = s.split('-').map(Number);
    return new Date(year, month - 1, day);
  })
  .refine(
    (d) => d.getDay() === 1, // 1 = Monday
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
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
  const isCurrentWeek = isSameDay(weekStartDate, currentWeekStart(today));

  const userId = await getCurrentUserId();

  const [days, userTasks, weekPlan, todayLogs, allUserTags] = await Promise.all([
    getWeekStatus(userId, weekStartDate),
    getUserTasks(userId),
    getWeekPlan(userId, weekStartStr),
    isCurrentWeek ? getDayLogs(userId, todayStr) : Promise.resolve([]),
    getUserTags(userId),
  ]);

  const allTasks = userTasks.map((t) => ({
    id: t.id,
    name: t.name,
    defaultQty: t.defaultQty,
  }));
  const activeTasks = weekPlan?.tasks ?? [];

  return (
    <div className="shell">
      {isCurrentWeek && <HomeGreetingLive initialTime={today.toISOString()} />}
      {!isCurrentWeek && (
        <div className="greeting">
          <h1>Semana de {format(weekStartDate, "d 'de' MMMM", { locale: ptBR })}</h1>
          <p>Visualizando uma semana {weekStartDate > today ? 'futura' : 'passada'}.</p>
        </div>
      )}

      <LogsProvider initialLogs={isCurrentWeek ? todayLogs : []} todayStr={todayStr}>
        <HomeCalendarSection
          weekStart={weekStartStr}
          days={days}
          allUserTags={allUserTags}
        />

        <div className="stack">
          {isCurrentWeek && (
            <DailyLogPanel activeTasks={activeTasks} />
          )}
          <WeeklyTasksPanel
            weekStart={weekStartStr}
            activeTasks={activeTasks}
            allTasks={allTasks}
          />
        </div>
      </LogsProvider>
    </div>
  );
}
