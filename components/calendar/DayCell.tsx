'use client';

import Link from 'next/link';
import { formatDateParam } from '@/lib/utils/date';
import type { MoodValue } from '@/lib/types/calendar';

export interface DayCellProps {
  date: Date;
  logCount: number;
  mood: MoodValue | null;
  isToday: boolean;
  isFuture: boolean;
}

function formatLogCount(count: number): string {
  if (count >= 100) return '99+';
  return String(count);
}

export function DayCell({ date, logCount, mood, isToday, isFuture }: DayCellProps) {
  const href = `/day/${formatDateParam(date)}`;

  return (
    <Link
      href={href}
      aria-current={isToday ? 'date' : undefined}
      className={`day-cell${isToday ? ' day-cell--today' : ''}${isFuture ? ' day-cell--future' : ''}`}
    >
      <span className="day-cell__date">
        {date.getDate()}
      </span>

      <span className="day-cell__log-count">
        {formatLogCount(logCount)}
      </span>

      {logCount > 0 && (
        <span className="day-cell__log-indicator" aria-label="tem registros" />
      )}

      {mood !== null && (
        <span className="day-cell__mood-indicator" data-mood={mood} aria-label={`humor: ${mood}`} />
      )}
    </Link>
  );
}

export default DayCell;
