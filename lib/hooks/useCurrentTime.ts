"use client";

import { useState, useEffect } from "react";

interface UseCurrentTimeOptions {
  /** Interval in ms between time checks. Default: 30000 (30s) */
  intervalMs?: number;
  /** Initial time for SSR hydration (avoids hydration mismatch) */
  initialTime?: Date;
}

/**
 * Returns a reactive Date that updates:
 * - Every `intervalMs` milliseconds
 * - Immediately when document becomes visible after being hidden
 */
export function useCurrentTime(options?: UseCurrentTimeOptions): Date {
  const { intervalMs = 30000, initialTime } = options ?? {};

  const [currentTime, setCurrentTime] = useState<Date>(initialTime ?? new Date());

  useEffect(() => {
    const tick = () => setCurrentTime(new Date());

    const intervalId = setInterval(tick, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    // Gracefully degrade if visibilityState is not supported
    const supportsVisibility = typeof document !== "undefined" && "visibilityState" in document;
    if (supportsVisibility) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      clearInterval(intervalId);
      if (supportsVisibility) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [intervalMs]);

  return currentTime;
}
