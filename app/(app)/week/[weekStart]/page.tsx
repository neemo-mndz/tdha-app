import Link from 'next/link';
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
import { HomeGreetingLive, MonthBadgeLive } from '@/components/home/HomeGreetingLive';
import { DailyLogPanel } from '@/components/home/DailyLogPanel';
import { WeeklyTasksPanel } from '@/components/home/WeeklyTasksPanel';
import { HomeCalendarSection } from '@/components/home/HomeCalendarSection';

export const dynamic = 'force-dynamic';

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
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
  const isCurrentWeek = isSameDay(weekStartDate, currentWeekStart(today));

  const userId = await getCurrentUserId();

  const [days, userTasks, weekPlan, todayLogs] = await Promise.all([
    getWeekStatus(userId, weekStartDate),
    getUserTasks(userId),
    getWeekPlan(userId, weekStartStr),
    isCurrentWeek ? getDayLogs(userId, todayStr) : Promise.resolve([]),
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
          <MonthBadgeLive initialTime={today.toISOString()} />
        </div>
      </header>

      {isCurrentWeek && <HomeGreetingLive initialTime={today.toISOString()} />}
      {!isCurrentWeek && (
        <div className="greeting">
          <h1>Semana de {format(weekStartDate, "d 'de' MMMM", { locale: ptBR })}</h1>
          <p>Visualizando uma semana {weekStartDate > today ? 'futura' : 'passada'}.</p>
        </div>
      )}

      <HomeCalendarSection
        weekStart={weekStartDate}
        days={days}
        today={today}
        initialLogs={isCurrentWeek ? todayLogs : []}
      />

      <div className="stack">
        {isCurrentWeek && (
          <DailyLogPanel date={todayStr} activeTasks={activeTasks} />
        )}
        <WeeklyTasksPanel
          weekStart={weekStartStr}
          activeTasks={activeTasks}
          allTasks={allTasks}
        />
      </div>
    </div>
  );
}
