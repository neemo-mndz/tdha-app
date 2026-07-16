"use client";

import { useState } from "react";
import { isSameDay } from "date-fns";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";
import { TodayLogsCard } from "@/components/home/TodayLogsCard";
import type { DayStatus } from "@/lib/types/calendar";
import type { LogWithTask } from "@/lib/db/queries/logs";

interface HomeCalendarSectionProps {
  weekStart: Date;
  days: DayStatus[];
  today: Date;
  initialLogs: LogWithTask[]; // logs do dia de hoje, buscados no servidor
}

/**
 * Une o toggle do calendário semanal com o card "Registros do dia".
 * O card de registros fica sempre visível, independente do calendário
 * estar expandido ou recolhido, e reflete o dia selecionado pelo usuário.
 */
export function HomeCalendarSection({ weekStart, days, today, initialLogs }: HomeCalendarSectionProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(today instanceof Date ? today : new Date(today));

  // Ensure dates are proper Date objects after RSC serialization
  const weekStartDate = weekStart instanceof Date ? weekStart : new Date(weekStart);
  const todayDate = today instanceof Date ? today : new Date(today);
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
