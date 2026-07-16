'use client';

import { useRouter } from 'next/navigation';
import { addDays, subDays, isSameDay, format } from 'date-fns';
import { currentWeekStart, weekLabel } from '@/lib/utils/date';

export interface WeekNavigatorProps {
  weekStart: Date;       // semana atualmente exibida
  today: Date;           // para determinar se está na semana atual
}

export function WeekNavigator({ weekStart, today }: WeekNavigatorProps) {
  const router = useRouter();

  // Ensure dates are proper Date objects after RSC serialization
  // Use parseISO-safe reconstruction to avoid timezone shifts
  const weekStartDate = weekStart instanceof Date ? weekStart : new Date(weekStart);
  const todayDate = today instanceof Date ? today : new Date(today);

  const isCurrentWeek = isSameDay(weekStartDate, currentWeekStart(todayDate));

  function handlePrevWeek() {
    const prevWeek = subDays(weekStartDate, 7);
    router.push(`/week/${format(prevWeek, 'yyyy-MM-dd')}`);
  }

  function handleNextWeek() {
    const nextWeek = addDays(weekStartDate, 7);
    router.push(`/week/${format(nextWeek, 'yyyy-MM-dd')}`);
  }

  function handleToday() {
    router.push('/');
  }

  return (
    <nav className="week-navigator" aria-label="Navegação de semanas">
      <button
        type="button"
        onClick={handlePrevWeek}
        aria-label="Semana anterior"
        className="week-navigator__btn week-navigator__btn--prev"
      >
        ← semana anterior
      </button>

      <span className="week-navigator__label">
        {weekLabel(weekStartDate)}
      </span>

      <button
        type="button"
        onClick={handleNextWeek}
        aria-label="Próxima semana"
        className="week-navigator__btn week-navigator__btn--next"
      >
        próxima semana →
      </button>

      {!isCurrentWeek && (
        <button
          type="button"
          onClick={handleToday}
          aria-label="Voltar para semana atual"
          className="week-navigator__btn week-navigator__btn--today"
        >
          hoje
        </button>
      )}
    </nav>
  );
}

export default WeekNavigator;
