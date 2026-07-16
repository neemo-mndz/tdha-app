import { isSameDay, isFuture as isFutureDate } from 'date-fns';
import { DayCell } from './DayCell';
import { WeekNavigator } from './WeekNavigator';
import type { DayStatus } from '@/lib/types/calendar';

export interface WeeklyCalendarProps {
  weekStart: Date;       // segunda-feira da semana exibida
  days: DayStatus[];     // 7 itens, ordenados seg→dom
  today: Date;           // passado do servidor para evitar hidratação errada
  selectedDate?: Date;             // dia atualmente selecionado (opcional)
  onSelectDay?: (date: Date) => void; // ao informar, clique seleciona em vez de navegar
}

export function WeeklyCalendar({ weekStart, days, today, selectedDate, onSelectDay }: WeeklyCalendarProps) {
  return (
    <section className="weekly-calendar" aria-label="Calendário semanal">
      <WeekNavigator weekStart={weekStart} today={today} />

      <div className="weekly-calendar__grid">
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

export default WeeklyCalendar;
