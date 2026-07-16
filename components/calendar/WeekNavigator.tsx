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

  const isCurrentWeek = isSameDay(weekStart, currentWeekStart(today));

  function handlePrevWeek() {
    router.push(weekPath(subWeeks(weekStart, 1)));
  }

  function handleNextWeek() {
    router.push(weekPath(addWeeks(weekStart, 1)));
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
        {weekLabel(weekStart)}
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
