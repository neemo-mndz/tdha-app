'use client';

import { useRouter } from 'next/navigation';
import { addWeeks, subWeeks, isSameDay } from 'date-fns';
import { currentWeekStart, weekPath, weekLabel } from '@/lib/utils/date';

export interface WeekNavigatorProps {
  weekStart: Date;       // semana atualmente exibida
  today: Date;           // para determinar se está na semana atual
}

export function WeekNavigator({ weekStart, today }: WeekNavigatorProps) {
  const router = useRouter();

  // Ensure dates are proper Date objects (RSC serialization may pass strings)
  const weekStartDate = weekStart instanceof Date ? weekStart : new Date(weekStart);
  const todayDate = today instanceof Date ? today : new Date(today);

  const isCurrentWeek = isSameDay(weekStartDate, currentWeekStart(todayDate));

  function handlePrevWeek() {
    router.push(weekPath(subWeeks(weekStartDate, 1)));
  }

  function handleNextWeek() {
    router.push(weekPath(addWeeks(weekStartDate, 1)));
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
