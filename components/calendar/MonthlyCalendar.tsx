'use client';

import { isSameDay, isFuture as isFutureDate } from 'date-fns';
import { DayCell } from './DayCell';
import type { DayStatus } from '@/lib/types/calendar';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const WEEKDAY_HEADERS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

export interface MonthlyCalendarProps {
  year: number;
  month: number; // 1-indexed
  days: DayStatus[];
  today: Date;
  selectedDate?: Date;
  onSelectDay?: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
}

export function MonthlyCalendar({
  year,
  month,
  days,
  today,
  selectedDate,
  onSelectDay,
  onMonthChange,
}: MonthlyCalendarProps) {
  // Calculate leading empty cells (Monday = 0, Sunday = 6)
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const jsDay = firstDayOfMonth.getDay(); // 0=Sunday, 1=Monday...
  // Convert to Monday-based: Mon=0, Tue=1, ..., Sun=6
  const leadingEmpty = jsDay === 0 ? 6 : jsDay - 1;

  function handlePrevMonth() {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  }

  function handleNextMonth() {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <section className="monthly-calendar" aria-label="Calendário mensal">
      <div className="monthly-calendar__header">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Mês anterior"
          className="monthly-calendar__nav-btn"
        >
          ← mês anterior
        </button>

        <span className="monthly-calendar__title">{monthLabel}</span>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Próximo mês"
          className="monthly-calendar__nav-btn"
        >
          próximo mês →
        </button>
      </div>

      <div className="monthly-calendar__weekdays">
        {WEEKDAY_HEADERS.map((wd) => (
          <span key={wd} className="monthly-calendar__weekday">{wd}</span>
        ))}
      </div>

      <div className="monthly-calendar__grid">
        {/* Leading empty cells */}
        {Array.from({ length: leadingEmpty }).map((_, i) => (
          <div key={`empty-start-${i}`} className="monthly-calendar__empty" />
        ))}

        {/* Day cells */}
        {days.map((day) => (
          <DayCell
            key={day.date.toISOString()}
            date={day.date}
            logCount={day.logCount}
            mood={day.mood}
            isToday={isSameDay(day.date, today)}
            isFuture={isFutureDate(day.date)}
            isSelected={selectedDate ? isSameDay(day.date, selectedDate) : false}
            onSelect={onSelectDay}
          />
        ))}
      </div>
    </section>
  );
}

export default MonthlyCalendar;
