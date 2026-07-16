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
    <div
      className="mini-week-calendar"
      role="group"
      aria-label="Calendário semanal de leitura"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        textAlign: "center",
      }}
    >
      {weekDays.map((date, index) => {
        const isToday = date === today;
        const isFuture = date > today;
        const isPast = date < today;
        const isRead = optimisticReadDays.includes(date);

        return (
          <button
            key={date}
            type="button"
            disabled={isFuture}
            onClick={isPast ? () => handleDayClick(date) : undefined}
            aria-label={`${DAY_LABELS[index]} ${getDayNumber(date)}${isRead ? " — lido" : ""}${isToday ? " (hoje)" : ""}`}
            aria-pressed={isPast ? isRead : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              padding: "6px 4px",
              borderRadius: "8px",
              border: "none",
              background: isRead ? "var(--color-accent, #7C9A6E)" : "var(--color-surface, #2a2a2a)",
              color: isFuture
                ? "var(--color-muted, #666)"
                : isRead
                  ? "#fff"
                  : "var(--color-text, #e0e0e0)",
              opacity: isFuture ? 0.4 : 1,
              cursor: isFuture ? "not-allowed" : isPast ? "pointer" : "default",
              fontSize: "12px",
              fontWeight: isToday ? 700 : 400,
              outline: isToday ? "2px solid var(--color-accent, #7C9A6E)" : "none",
              outlineOffset: "2px",
              transition: "background 0.15s, transform 0.1s",
            }}
          >
            <span style={{ fontSize: "10px", textTransform: "uppercase" }}>
              {DAY_LABELS[index]}
            </span>
            <span style={{ fontSize: "14px" }}>{getDayNumber(date)}</span>
            {isRead && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#fff",
                }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
