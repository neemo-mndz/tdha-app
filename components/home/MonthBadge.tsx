"use client";


import { useCurrentTime } from "@/lib/hooks/useCurrentTime";

/**
 * Client component that shows days remaining in the month.
 * Updates live using useCurrentTime (handles day boundary crossings).
 * No server props needed — uses client-side Date directly.
 */
export function MonthBadge() {
  const now = useCurrentTime({ initialTime: new Date() });
  const text = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(now);

  return <span className="month-badge">{text}</span>;
}
