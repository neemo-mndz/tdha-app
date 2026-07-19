"use client";

import { addDays, format, subWeeks, addWeeks } from "date-fns";

interface DaySelectorProps {
  weekStart: string;
  daysWithData: string[];
  selectedDays: string[];
  onSelectionChange: (days: string[]) => void;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function DaySelector({
  weekStart,
  daysWithData,
  selectedDays,
  onSelectionChange,
  weekOffset,
  onWeekOffsetChange,
}: DaySelectorProps) {
  const baseWeekStart = new Date(weekStart + "T00:00:00");
  const currentWeekStart =
    weekOffset === 0
      ? baseWeekStart
      : weekOffset < 0
        ? subWeeks(baseWeekStart, Math.abs(weekOffset))
        : addWeeks(baseWeekStart, weekOffset);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayNum = format(date, "dd/MM");
    return { date, dateStr, dayNum, index: i };
  });

  const weekLabel = `${format(days[0].date, "dd/MM")} – ${format(days[6].date, "dd/MM/yyyy")}`;

  function toggleDay(dateStr: string) {
    const current = new Set(selectedDays);
    if (current.has(dateStr)) {
      if (current.size <= 1) return; // mínimo 1 dia selecionado
      current.delete(dateStr);
    } else {
      current.add(dateStr);
    }
    onSelectionChange(Array.from(current));
  }

  function goToPreviousWeek() {
    onWeekOffsetChange(weekOffset - 1);
  }

  function goToNextWeek() {
    if (weekOffset >= 0) return;
    onWeekOffsetChange(weekOffset + 1);
  }

  const canGoNext = weekOffset < 0;

  return (
    <div className="day-selector">
      <nav className="day-selector__nav" aria-label="Navegação de semanas">
        <button
          type="button"
          className="day-selector__arrow"
          onClick={goToPreviousWeek}
          aria-label="Semana anterior"
        >
          ←
        </button>
        <span className="day-selector__week-label">{weekLabel}</span>
        <button
          type="button"
          className="day-selector__arrow"
          onClick={goToNextWeek}
          disabled={!canGoNext}
          aria-label="Próxima semana"
        >
          →
        </button>
      </nav>

      <div className="day-selector__grid" role="group" aria-label="Seleção de dias">
        {days.map((day) => {
          const hasData = daysWithData.includes(day.dateStr);
          const isSelected = selectedDays.includes(day.dateStr);
          const isOnlySelected = isSelected && selectedDays.length === 1;

          return (
            <label
              key={day.dateStr}
              className={[
                "day-selector__day",
                isSelected && "day-selector__day--selected",
                hasData && "day-selector__day--has-data",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="checkbox"
                className="day-selector__checkbox"
                checked={isSelected}
                onChange={() => toggleDay(day.dateStr)}
                disabled={isOnlySelected}
                aria-label={`${DAY_LABELS[day.index]} ${day.dayNum}`}
              />
              <span className="day-selector__label">{DAY_LABELS[day.index]}</span>
              <span className="day-selector__date">{day.dayNum}</span>
              {hasData && <span className="day-selector__dot" aria-label="Tem registros" />}
            </label>
          );
        })}
      </div>
    </div>
  );
}
