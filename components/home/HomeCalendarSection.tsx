"use client";

import { useState } from "react";
import { isSameDay } from "date-fns";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";
import { TodayLogsCard } from "@/components/home/TodayLogsCard";
import type { DayStatus } from "@/lib/types/calendar";
import type { LogWithTask } from "@/lib/db/queries/logs";

/** Parse "yyyy-MM-dd" as local date without timezone shift */
function parseDateString(s: string | Date): Date {
  if (s instanceof Date) return s;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface HomeCalendarSectionProps {
  weekStart: string; // "yyyy-MM-dd" format from server
  days: DayStatus[];
  today: string; // "yyyy-MM-dd" format from server
  initialLogs: LogWithTask[]; // logs do dia de hoje, buscados no servidor
}

/**
 * Une o toggle do calendário semanal com o card "Registros do dia".
 * O card de registros fica sempre visível, independente do calendário
 * estar expandido ou recolhido, e reflete o dia selecionado pelo usuário.
 */
export function HomeCalendarSection({ weekStart, days, today, initialLogs }: HomeCalendarSectionProps) {
  // Parse date strings as local dates (no timezone shift)
  const weekStartDate = parseDateString(weekStart);
  const todayDate = parseDateString(today);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(todayDate);

  const normalizedDays = days.map((d) => ({
    ...d,
    date: d.date instanceof Date ? d.date : new Date(d.date),
  }));

  function handleSelectDay(date: Date) {
    setSelectedDate(date);
  }

  return (
    <>
      <button
        className="calendar-toggle"
        onClick={() => setCalendarOpen(!calendarOpen)}
        aria-expanded={calendarOpen}
      >
        <span>{calendarOpen ? "Ocultar calendário" : "Ver calendário da semana"}</span>
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
          maxHeight: calendarOpen ? "900px" : "0",
          overflow: "hidden",
          transition: "max-height 0.28s ease",
        }}
      >
        <WeeklyCalendar
          weekStart={weekStartDate}
          days={normalizedDays}
          today={todayDate}
          selectedDate={selectedDate}
          onSelectDay={handleSelectDay}
        />
      </div>

      <TodayLogsCard
        selectedDate={selectedDate}
        today={todayDate}
        initialLogs={isSameDay(selectedDate, todayDate) ? initialLogs : []}
      />
    </>
  );
}
