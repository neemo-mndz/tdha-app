"use client";

import { getBadgeText } from "@/lib/utils/greeting";
import { useCurrentTime } from "@/lib/hooks/useCurrentTime";

/**
 * Client component that shows days remaining in the month.
 * Updates live using useCurrentTime (handles day boundary crossings).
 * No server props needed — uses client-side Date directly.
 */
export function MonthBadge() {
  const now = useCurrentTime({ initialTime: new Date() });
  const text = getBadgeText(now);

  return <span className="month-badge">{text}</span>;
}
