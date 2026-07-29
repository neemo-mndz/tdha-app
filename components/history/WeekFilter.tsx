'use client';

import { addDays, subDays } from 'date-fns';
import { currentWeekStart, weekLabel } from '@/lib/utils/date';

export interface WeekFilterProps {
  selectedWeek: Date | null; // null = "Todas as semanas"
  onWeekChange: (week: Date | null) => void;
}

export function WeekFilter({ selectedWeek, onWeekChange }: WeekFilterProps) {
  function handlePrevWeek() {
    const base = selectedWeek ?? currentWeekStart();
    onWeekChange(subDays(base, 7));
  }

  function handleNextWeek() {
    const base = selectedWeek ?? currentWeekStart();
    onWeekChange(addDays(base, 7));
  }

  function handleClearWeek() {
    onWeekChange(null);
  }

  const label = selectedWeek ? weekLabel(selectedWeek) : 'Todas as semanas';

  return (
    <nav className="week-navigator" aria-label="Filtro por semana">
      <button
        type="button"
        onClick={handlePrevWeek}
        aria-label="Semana anterior"
        className="week-navigator__btn week-navigator__btn--prev"
      >
        <span className="week-navigator__btn-text">← semana anterior</span>
        <span className="week-navigator__btn-arrow">←</span>
      </button>

      <span className="week-navigator__label">{label}</span>

      <button
        type="button"
        onClick={handleNextWeek}
        aria-label="Próxima semana"
        className="week-navigator__btn week-navigator__btn--next"
      >
        <span className="week-navigator__btn-text">próxima semana →</span>
        <span className="week-navigator__btn-arrow">→</span>
      </button>

      {selectedWeek !== null && (
        <button
          type="button"
          onClick={handleClearWeek}
          aria-label="Ver todas as semanas"
          className="week-navigator__btn week-navigator__btn--today"
        >
          todas
        </button>
      )}
    </nav>
  );
}

export default WeekFilter;
