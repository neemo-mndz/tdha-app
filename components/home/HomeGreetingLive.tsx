"use client";

import { useCurrentTime } from "@/lib/hooks/useCurrentTime";
import { getGreetingText, formatGreetingDate, getBadgeText } from "@/lib/utils/greeting";

interface HomeGreetingLiveProps {
  /** Initial server time as ISO string for SSR hydration match */
  initialTime: string;
}

/**
 * Client component that renders greeting, date, subtitle, and badge.
 * Uses useCurrentTime to stay synchronized with device clock.
 * Replaces static HomeGreeting for live updates on period/date boundary crossings.
 */
export function HomeGreetingLive({ initialTime }: HomeGreetingLiveProps) {
  const currentTime = useCurrentTime({ initialTime: new Date(initialTime) });

  const greeting = getGreetingText(currentTime.getHours());
  const dateStr = formatGreetingDate(currentTime);

  return (
    <div className="greeting">
      <h1>{greeting}. Hoje é {dateStr}.</h1>
      <p>Seu espaço para registrar o dia, sem pressão.</p>
    </div>
  );
}

interface MonthBadgeLiveProps {
  /** Initial server time as ISO string for SSR hydration match */
  initialTime: string;
}

/**
 * Client component that renders the month badge with days remaining.
 * Uses useCurrentTime to stay synchronized with device clock.
 */
export function MonthBadgeLive({ initialTime }: MonthBadgeLiveProps) {
  const currentTime = useCurrentTime({ initialTime: new Date(initialTime) });

  const text = getBadgeText(currentTime);

  return <span className="month-badge">{text}</span>;
}
