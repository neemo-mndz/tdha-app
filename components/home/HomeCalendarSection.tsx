"use client";

import { useState, useTransition } from "react";
import { isSameDay } from "date-fns";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";
import MonthlyCalendar from "@/components/calendar/MonthlyCalendar";
import { TodayLogsCard } from "@/components/home/TodayLogsCard";
import { getMonthStatusAction } from "@/lib/actions/logs";
import type { DayStatus } from "@/lib/types/calendar";
import { useLogs } from "@/components/home/LogsProvider";

/** Parse "yyyy-MM-dd" as local date without timezone shift */
function parseDateString(s: string | Date): Date {
  if (s instanceof Date) return s;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

type ViewMode = 'week' | 'month';

interface HomeCalendarSectionProps {
  weekStart: string; // "yyyy-MM-dd" format from server
  days: DayStatus[];
  allUserTags?: { id: string; name: string }[];
}

/**
 * Une o toggle do calendário semanal/mensal com o card "Registros do dia".
 * O card de registros fica sempre visível, independente do calendário
 * estar expandido ou recolhido, e reflete o dia selecionado pelo usuário.
 */
export function HomeCalendarSection({ weekStart, days, allUserTags = [] }: HomeCalendarSectionProps) {
  const { selectedDate, setSelectedDate, todayDate } = useLogs();

  // Parse date strings as local dates (no timezone shift)
  const weekStartDate = parseDateString(weekStart);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Month view state
  const [monthYear, setMonthYear] = useState(weekStartDate.getFullYear());
  const [monthMonth, setMonthMonth] = useState(weekStartDate.getMonth() + 1); // 1-indexed
  const [monthDays, setMonthDays] = useState<DayStatus[]>([]);
  const [monthLoaded, setMonthLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const normalizedDays = days.map((d) => ({
    ...d,
    date: d.date instanceof Date ? d.date : new Date(d.date),
  }));

  function handleSelectDay(date: Date) {
    setSelectedDate(date);
  }

  function handleToggleCalendar() {
    setCalendarOpen(!calendarOpen);
  }

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    if (mode === 'month' && !monthLoaded) {
      fetchMonthData(monthYear, monthMonth);
    }
  }

  function fetchMonthData(year: number, month: number) {
    startTransition(async () => {
      const data = await getMonthStatusAction(year, month);
      // Normalize dates from server (they come serialized)
      const normalized = data.map((d) => ({
        ...d,
        date: d.date instanceof Date ? d.date : new Date(d.date),
      }));
      setMonthDays(normalized);
      setMonthLoaded(true);
    });
  }

  function handleMonthChange(year: number, month: number) {
    setMonthYear(year);
    setMonthMonth(month);
    setMonthLoaded(false);
    fetchMonthData(year, month);
  }

  return (
    <>
      <button
        className="calendar-toggle"
        onClick={handleToggleCalendar}
        aria-expanded={calendarOpen}
      >
        <span>{calendarOpen ? "Ocultar calendário" : "Ver calendário"}</span>
        <span
          style={{
            display: "inline-block",
            transition: "transform 0.2s ease",
            transform: calendarOpen ? "rotate(180deg)" : "none",
          }}
        >
          ⌄
        </span>
      </button>

      <div
        style={{
          maxHeight: calendarOpen ? "1200px" : "0",
          overflow: "hidden",
          transition: "max-height 0.28s ease",
        }}
      >
        {/* View mode toggle */}
        <div className="calendar-view-toggle">
          <button
            type="button"
            className={`calendar-view-toggle__btn${viewMode === 'week' ? ' calendar-view-toggle__btn--active' : ''}`}
            onClick={() => handleViewModeChange('week')}
          >
            semana
          </button>
          <button
            type="button"
            className={`calendar-view-toggle__btn${viewMode === 'month' ? ' calendar-view-toggle__btn--active' : ''}`}
            onClick={() => handleViewModeChange('month')}
          >
            mês
          </button>
        </div>

        <TodayLogsCard allUserTags={allUserTags} />

        {/* Weekly view */}
        {viewMode === 'week' && (
          <WeeklyCalendar
            weekStart={weekStartDate}
            days={normalizedDays}
            today={todayDate}
            selectedDate={selectedDate}
            onSelectDay={handleSelectDay}
          />
        )}

        {/* Monthly view */}
        {viewMode === 'month' && (
          <>
            {isPending && !monthLoaded && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '13px' }}>
                Carregando...
              </div>
            )}
            {monthLoaded && (
              <MonthlyCalendar
                year={monthYear}
                month={monthMonth}
                days={monthDays}
                today={todayDate}
                selectedDate={selectedDate}
                onSelectDay={handleSelectDay}
                onMonthChange={handleMonthChange}
              />
            )}
          </>
        )}
      </div>

    </>
  );
}
