'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

const MOOD_EMOJI: Record<MoodValue, string> = {
  great: '😊',
  good: '🙂',
  neutral: '😐',
  bad: '😞',
  awful: '😢',
};

export function DayCell({ date, logCount, mood, isToday, isFuture }: DayCellProps) {
  const href = `/day/${formatDateParam(date)}`;
  const weekday = format(date, 'EEE', { locale: ptBR });

  return (
    <Link
      href={href}
      aria-current={isToday ? 'date' : undefined}
      className={`day-cell${isToday ? ' day-cell--today' : ''}${isFuture ? ' day-cell--future' : ''}`}
    >
      <span className="day-cell__weekday">{weekday}</span>

      <span className="day-cell__date">
        {date.getDate()}
      </span>

      {logCount > 0 && (
        <>
          <span className="day-cell__log-indicator" aria-label="tem registros" />
          <span className="day-cell__log-count">
            {formatLogCount(logCount)}
          </span>
        </>
      )}

      {mood !== null && (
        <span className="day-cell__mood" data-mood={mood} aria-label={`humor: ${mood}`}>
          {MOOD_EMOJI[mood]}
        </span>
      )}
    </Link>
  );
}

export default DayCell;
