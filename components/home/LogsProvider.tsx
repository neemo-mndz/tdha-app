"use client";

import { createContext, useContext, useState, useOptimistic, useEffect, useCallback, type ReactNode } from "react";
import { logsReducer, type OptimisticAction } from "@/components/logs/optimisticLogs";
import type { LogWithTask } from "@/lib/db/queries/logs";
import { format, isSameDay } from "date-fns";

/** Parse "yyyy-MM-dd" as local date without timezone shift */
function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface LogsContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  logs: LogWithTask[];
  setLogs: (logs: LogWithTask[]) => void;
  optimisticLogs: LogWithTask[];
  dispatchOptimistic: (action: OptimisticAction) => void;
  todayDate: Date;
}

const LogsContext = createContext<LogsContextType | null>(null);

export function LogsProvider({
  children,
  initialLogs,
  todayStr,
}: {
  children: ReactNode;
  initialLogs: LogWithTask[];
  todayStr: string;
}) {
  const [todayDate] = useState(() => parseDateString(todayStr));
  const [selectedDate, selectDate] = useState<Date>(todayDate);
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const [dayLogs, setDayLogs] = useState({ date: todayStr, logs: initialLogs });
  const logs = dayLogs.logs;
  // Bind each result to the date that requested it; late responses cannot replace another day.
  const setLogs = useCallback((next: LogWithTask[]) => {
    setDayLogs(current => current.date === dateStr ? { date: dateStr, logs: next } : current);
  }, [dateStr]);
  function setSelectedDate(date: Date) {
    const nextDate = format(date, "yyyy-MM-dd");
    selectDate(date);
    setDayLogs(current => current.date === nextDate ? current : {
      date: nextDate, logs: nextDate === todayStr ? initialLogs : [],
    });
  }

  const [optimisticLogs, dispatchOptimistic] = useOptimistic(
    logs,
    logsReducer
  );

  // When initialLogs from server changes (e.g. after a Server Action revalidates),
  // we update our local logs IF we are looking at today.
  useEffect(() => {
    if (isSameDay(selectedDate, todayDate)) {
      setLogs(initialLogs);
    }
  }, [initialLogs, selectedDate, todayDate, setLogs]);

  return (
    <LogsContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        logs,
        setLogs,
        optimisticLogs,
        dispatchOptimistic,
        todayDate,
      }}
    >
      {children}
    </LogsContext.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used within LogsProvider");
  return ctx;
}
