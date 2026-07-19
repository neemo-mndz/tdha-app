"use server";

import { getWeekReportSchema } from "@/lib/validation/profile.schema";
import { getCurrentUserId } from "@/lib/auth";
import {
  getReportLogs,
  getReportTaskProgress,
  getReportReadingActivity,
} from "@/lib/db/queries/report";
import { getUserProfile } from "@/lib/db/queries/profile";
import type { WeekReportData, ReportDay } from "@/lib/types/report";
import { startOfWeek } from "date-fns";

export async function getWeekReportData(
  input: unknown
): Promise<WeekReportData | { success: false; error: string }> {
  const parsed = getWeekReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const userId = await getCurrentUserId();
  const dates = parsed.data.dates;

  // Get user profile for name
  const profile = await getUserProfile(userId);

  // Get the week start from the first date (find the Monday)
  const sortedDates = [...dates].sort();
  const firstDate = new Date(sortedDates[0] + "T00:00:00Z");
  const weekStart = startOfWeek(firstDate, { weekStartsOn: 1 })
    .toISOString()
    .slice(0, 10);

  // Fetch data in parallel
  const [logs, taskProgress, readingActivity] = await Promise.all([
    getReportLogs(userId, dates),
    getReportTaskProgress(userId, weekStart),
    getReportReadingActivity(userId, dates),
  ]);

  // Build days array, sorted chronologically
  const days: ReportDay[] = sortedDates.map((date) => {
    const dayLogs = logs
      .filter((l) => l.date === date)
      .map((l) => ({ content: l.content, createdAt: l.createdAt.toISOString() }));

    const dayReading = readingActivity.find((r) => r.date === date);

    return {
      date,
      logs: dayLogs,
      taskProgress, // Same for all days in the week
      readingActivity: dayReading
        ? { bookTitle: dayReading.bookTitle, date: dayReading.date }
        : null,
    };
  });

  // Date range
  const dateRange = {
    start: sortedDates[0],
    end: sortedDates[sortedDates.length - 1],
  };

  return {
    userName: profile?.name ?? null,
    dateRange,
    days,
  };
}
