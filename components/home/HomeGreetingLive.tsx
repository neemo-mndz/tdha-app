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

  const brazilTime = new Date(currentTime.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const greeting = getGreetingText(brazilTime.getHours());
  const dateStr = formatGreetingDate(brazilTime);

  return (
    <div className="greeting">
      <h1>{greeting} — {dateStr}</h1>
      <p>Sua semana em um só lugar, no seu ritmo.</p>
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
