"use client";

import { useOptimistic, useTransition } from "react";
import { toggleReadingDay } from "@/lib/actions/readingLogs";

export interface MiniWeekCalendarProps {
  bookId: string;
  weekStart: string; // yyyy-MM-dd (segunda-feira)
  readDays: string[]; // datas com registro nesta semana
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function generateWeekDays(weekStart: string): string[] {
  const [year, month, day] = weekStart.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
}

function getTodayStr(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDayNumber(dateStr: string): number {
  return Number(dateStr.split("-")[2]);
}

type OptimisticAction = { type: "toggle"; date: string };

function readDaysReducer(
  state: string[],
  action: OptimisticAction
): string[] {
  if (action.type === "toggle") {
    if (state.includes(action.date)) {
      return state.filter((d) => d !== action.date);
    }
    return [...state, action.date];
  }
  return state;
}

export function MiniWeekCalendar({
  bookId,
  weekStart,
  readDays,
}: MiniWeekCalendarProps) {
  const [optimisticReadDays, dispatchOptimistic] = useOptimistic(
    readDays,
    readDaysReducer
  );
  const [isPending, startTransition] = useTransition();

  const weekDays = generateWeekDays(weekStart);
  const today = getTodayStr();

  const handleDayClick = (date: string) => {
    startTransition(async () => {
      dispatchOptimistic({ type: "toggle", date });
      await toggleReadingDay({ bookId, date });
    });
  };

  return (
    <div className="mini-week-wrapper">
      <div
        className="mini-week-calendar"
        role="group"
        aria-label="Calendário semanal de leitura"
      >
      {weekDays.map((date, index) => {
        const isToday = date === today;
        const isFuture = date > today;
        const isPast = date < today;
        const isRead = optimisticReadDays.includes(date);

        const classNames = [
          "mini-week-calendar__cell",
          isRead && "mini-week-calendar__cell--read",
          isToday && "mini-week-calendar__cell--today",
          isFuture && "mini-week-calendar__cell--future",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={date}
            type="button"
            className={classNames}
            disabled={isFuture}
            onClick={isPast ? () => handleDayClick(date) : undefined}
            aria-label={`${DAY_LABELS[index]} ${getDayNumber(date)}${isRead ? " — lido" : ""}${isToday ? " (hoje)" : ""}`}
            aria-pressed={isPast ? isRead : undefined}
          >
            <span className="mini-week-calendar__weekday">
              {DAY_LABELS[index]}
            </span>
            <span className="mini-week-calendar__date">
              {isRead ? "✓" : "·"}
            </span>
          </button>
        );
      })}
    </div>
      <p className="mini-week-calendar__hint">
        Dias em que você leu essa semana — clique para marcar/desmarcar um dia passado
      </p>
    </div>
  );
}
